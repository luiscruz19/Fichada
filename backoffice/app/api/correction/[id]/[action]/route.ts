import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

// Proxy server-side: aprueba/rechaza una solicitud de corrección con el JWT del admin (cookie).
export async function POST(req: Request, { params }: { params: { id: string; action: string } }) {
    const { id, action } = params;
    if (action !== 'approve' && action !== 'reject') {
        return NextResponse.json({ ok: false, message: 'Acción inválida' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const res = await apiFetch(`/correction-requests/admin/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    return NextResponse.json(json ?? { ok: res.ok }, { status: res.status });
}
