import * as SecureStore from 'expo-secure-store';

// La app habla SOLO con el api (auth queda interno; el login pega a POST /auth/login del api).
// Base del backend: en builds EAS se inyecta EXPO_PUBLIC_API_URL en build-time (dominio real,
// p.ej. https://fichada.sda.ovh/api) y GANA sobre cualquier default. Si no está (dev local con
// Expo Go/emulador) cae al gateway de Traefik con Host-routing (Host: fichada-api.localhost).
const PUBLIC_API = process.env.EXPO_PUBLIC_API_URL;
const LOCAL_GATEWAY = 'http://10.0.2.2';
const LOCAL_API_HOST = 'fichada-api.localhost';
const USE_LOCAL = !PUBLIC_API;
const BASE = (PUBLIC_API || LOCAL_GATEWAY).replace(/\/$/, '');

function baseHeaders(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (USE_LOCAL) h.Host = LOCAL_API_HOST;
    return h;
}

let token = null;

export async function loadToken() {
    token = await SecureStore.getItemAsync('fichada_token');
    return token;
}
export async function setToken(t) {
    token = t;
    await SecureStore.setItemAsync('fichada_token', t);
}
export async function clearToken() {
    token = null;
    await SecureStore.deleteItemAsync('fichada_token');
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
