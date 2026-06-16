import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4001';
const BASIC = 'Basic ' + Buffer.from(
    `${process.env.AUTH_BASIC_USER || 'auth'}:${process.env.AUTH_BASIC_PW || 'secret'}`
).toString('base64');

export const TOKEN_COOKIE = 'fichada_token';

/** Login contra el servicio auth (Basic Auth servicio↔servicio, server-side). Devuelve el JWT o null. */
export async function authLogin(email: string, password: string): Promise<string | null> {
    const res = await fetch(`${AUTH_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: BASIC },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.user?.token) return null;
    return json.user.token as string;
}

export function getToken(): string | null {
    return cookies().get(TOKEN_COOKIE)?.value || null;
}

/** Llama al api de dominio con el JWT del admin (header `token`). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = getToken();
    return fetch(`${API_URL}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', token: token || '', ...(init.headers || {}) },
        cache: 'no-store',
    });
}

export async function apiGetJson<T = any>(path: string): Promise<T | null> {
    try {
        const res = await apiFetch(path);
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}
