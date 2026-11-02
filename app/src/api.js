import { getItem, setItem, deleteItem } from './storage';

const PUBLIC_API = process.env.EXPO_PUBLIC_API_URL;
const LOCAL_GATEWAY = 'http://10.0.2.2';
const LOCAL_API_HOST = 'fichada-api.localhost';
// Un `eas update` publicado sin la variable no puede caer al gateway local: dejaría a todos sin backend.
const PROD_API = 'https://fichada.sda.ovh/api';
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;
const USE_LOCAL = !PUBLIC_API && IS_DEV;
const BASE = (PUBLIC_API || (IS_DEV ? LOCAL_GATEWAY : PROD_API)).replace(/\/$/, '');
const TOKEN_KEY = 'fichada_token';
const CLOCK_SKEW_MS = 30000;

function baseHeaders(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (USE_LOCAL) h.Host = LOCAL_API_HOST;
    return h;
}

let token = null;

export async function loadToken() {
    token = await getItem(TOKEN_KEY);
    return token;
}
async function setToken(t) {
    token = t;
    await setItem(TOKEN_KEY, t);
}
export async function clearToken() {
    token = null;
    await deleteItem(TOKEN_KEY);
}

// A mano: en Hermes atob no está garantizado y no vale una dependencia por diez líneas.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64urlDecode(s) {
    let bits = 0, val = 0, out = '';
    for (const ch of s.replace(/-/g, '+').replace(/_/g, '/')) {
        const i = B64.indexOf(ch);
        if (i < 0) continue;
        val = (val << 6) | i; bits += 6;
        if (bits >= 8) { bits -= 8; out += String.fromCharCode((val >> bits) & 0xff); }
    }
    return out;
}

// Token ilegible o sin exp: devuelve false y decide el backend con un 401.
export function tokenVencido(tk) {
    try {
        const p = JSON.parse(b64urlDecode(String(tk).split('.')[1] || ''));
        if (!p || !p.exp) return false;
        return p.exp * 1000 <= Date.now() + CLOCK_SKEW_MS;
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

async function authenticate(path, credentials, fallbackMessage) {
    const res = await fetch(BASE + path, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify(credentials),
    });
    const json = await res.json().catch(() => null);
    if (!json?.user?.token) throw new Error(json?.message || fallbackMessage);
    await setToken(json.user.token);
    return json.user;
}

export const login = (email, password) => authenticate('/auth/login', { email, password }, 'Credenciales inválidas');

export const hasPin = (email) => req(`/auth/has-pin?email=${encodeURIComponent(email)}`);

export const loginPin = (email, pin) => authenticate('/auth/login-pin', { email, pin }, 'PIN incorrecto');

export const setPinRemote = (pin) => req('/auth/set-pin', { method: 'POST', body: JSON.stringify({ pin }) });

export const getProfile = () => req('/employees/employee/me');
export const getStatus = () => req('/shifts/employee/status');
export const getHistory = () => req('/shifts/employee/history');
export const clockIn = (lat, lng, accuracy) => req('/shifts/employee/clock-in', { method: 'POST', body: JSON.stringify({ lat, lng, accuracy }) });
export const clockOut = (lat, lng, accuracy) => req('/shifts/employee/clock-out', { method: 'POST', body: JSON.stringify({ lat, lng, accuracy }) });
export const startBreak = () => req('/shifts/employee/breaks/start', { method: 'POST', body: '{}' });
export const endBreak = () => req('/shifts/employee/breaks/end', { method: 'POST', body: '{}' });

export const registerDevice = (payload) => req('/devices/employee/register', { method: 'POST', body: JSON.stringify(payload) });

export const createCorrectionRequest = (payload) => req('/correction-requests/employee', { method: 'POST', body: JSON.stringify(payload) });

export const listNotifications = () => req('/notifications/employee');
export const markNotificationRead = (id) => req(`/notifications/employee/${id}/read`, { method: 'PATCH', body: '{}' });
