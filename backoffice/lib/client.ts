'use client';

import { BASE_PATH } from './config';

export async function px(path: string, opts: RequestInit = {}) {
    const res = await fetch(BASE_PATH + '/api/proxy' + path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
}
