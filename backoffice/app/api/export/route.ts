import { apiFetch } from '@/lib/api';

// Proxy de descarga: agrega el JWT del admin (cookie) al export del api.
export async function GET(req: Request) {
    const qs = new URL(req.url).search;
    const res = await apiFetch(`/shifts/admin/export${qs}`);
    const buf = await res.arrayBuffer();
    return new Response(buf, {
        status: res.status,
        headers: {
            'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment',
        },
    });
}
