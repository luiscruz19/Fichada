import { getItem, setItem, deleteItem } from './storage';

// La app habla SOLO con el api (auth queda interno; el login pega a POST /auth/login del api).
// Base del backend: en builds EAS se inyecta EXPO_PUBLIC_API_URL en build-time (dominio real,
// p.ej. https://fichada.sda.ovh/api) y GANA sobre cualquier default. Si no está (dev local con
// Expo Go/emulador) cae al gateway de Traefik con Host-routing (Host: fichada-api.localhost).
const PUBLIC_API = process.env.EXPO_PUBLIC_API_URL;
const LOCAL_GATEWAY = 'http://10.0.2.2';
const LOCAL_API_HOST = 'fichada-api.localhost';
// Guardarraíl: si la variable no llegó (p.ej. un `eas update` publicado sin ella), en la app
// instalada NO se puede caer al gateway local — dejaría a todos sin backend. Ahí manda el
// dominio real; el fallback local queda solo para desarrollo.
const PROD_API = 'https://fichada.sda.ovh/api';
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;
const USE_LOCAL = !PUBLIC_API && IS_DEV;
const BASE = (PUBLIC_API || (IS_DEV ? LOCAL_GATEWAY : PROD_API)).replace(/\/$/, '');

function baseHeaders(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (USE_LOCAL) h.Host = LOCAL_API_HOST;
    return h;
}

let token = null;

export async function loadToken() {
    token = await getItem('fichada_token');
    return token;
}
export async function setToken(t) {
    token = t;
    await setItem('fichada_token', t);
}
export async function clearToken() {
    token = null;
    await deleteItem('fichada_token');
}

// El JWT del backend trae `exp` en segundos. Decodificamos el payload a mano: en Hermes
// `atob` no está garantizado y no vale traerse una dependencia por diez líneas.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64urlDecode(s) {
    let bits = 0, val = 0, out = '';
    for (const ch of s.replace(/-/g, '+').replace(/_/g, '/')) {
        const i = B64.indexOf(ch);
        if (i < 0) continue; // padding y basura
        val = (val << 6) | i; bits += 6;
        if (bits >= 8) { bits -= 8; out += String.fromCharCode((val >> bits) & 0xff); }
    }
    return out;
}

// ¿La sesión guardada ya venció? 30s de margen por desfasaje de reloj del teléfono.
// Si el token es ilegible o no trae `exp`, devolvemos false y que decida el backend (401).
export function tokenVencido(tk) {
    try {
        const p = JSON.parse(b64urlDecode(String(tk).split('.')[1] || ''));
        if (!p || !p.exp) return false;
        return p.exp * 1000 <= Date.now() + 30000;
    } catch { return false; }
}

async function req(path, opts = {}) {
    const res = await fetch(BASE + path, {
        ...opts,
        headers: baseHeaders({ token: token || '', ...(opts.headers || {}) }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        const err = new Error(json?.message || 'No se pudo completar la operación');
        err.status = res.status;
        throw err;
    }
    return json;
}

export async function login(email, password) {
    const res = await fetch(BASE + '/auth/login', {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.user?.token) throw new Error(json?.message || 'Credenciales inválidas');
    await setToken(json.user.token);
    return json.user;
}

// ¿Ese email ya tiene PIN? (la app decide pedir PIN o contraseña)
export const hasPin = (email) => req(`/auth/has-pin?email=${encodeURIComponent(email)}`);

// Login por PIN (ingresos siguientes al primero).
export async function loginPin(email, pin) {
    const res = await fetch(BASE + '/auth/login-pin', {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({ email, pin }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.user?.token) throw new Error(json?.message || 'PIN incorrecto');
    await setToken(json.user.token);
    return json.user;
}

// Setear el PIN tras el primer ingreso (requiere sesión).
export const setPinRemote = (pin) => req('/auth/set-pin', { method: 'POST', body: JSON.stringify({ pin }) });

export const getProfile = () => req('/employees/employee/me');
export const getStatus = () => req('/shifts/employee/status');
export const getHistory = () => req('/shifts/employee/history');
export const clockIn = (lat, lng, accuracy) => req('/shifts/employee/clock-in', { method: 'POST', body: JSON.stringify({ lat, lng, accuracy }) });
export const clockOut = (lat, lng, accuracy) => req('/shifts/employee/clock-out', { method: 'POST', body: JSON.stringify({ lat, lng, accuracy }) });
export const startBreak = () => req('/shifts/employee/breaks/start', { method: 'POST', body: '{}' });
export const endBreak = () => req('/shifts/employee/breaks/end', { method: 'POST', body: '{}' });

// Dispositivo (device-binding) + push
export const registerDevice = (payload) => req('/devices/employee/register', { method: 'POST', body: JSON.stringify(payload) });
export const updatePushToken = (device_uuid, push_token) => req('/devices/employee/push-token', { method: 'PATCH', body: JSON.stringify({ device_uuid, push_token }) });

// Solicitudes de corrección
export const listMyRequests = () => req('/correction-requests/employee');
export const createCorrectionRequest = (payload) => req('/correction-requests/employee', { method: 'POST', body: JSON.stringify(payload) });

// Notificaciones
export const listNotifications = () => req('/notifications/employee');
export const markNotificationRead = (id) => req(`/notifications/employee/${id}/read`, { method: 'PATCH', body: '{}' });
