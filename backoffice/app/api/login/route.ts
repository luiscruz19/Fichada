import { NextResponse } from 'next/server';
import { authLogin, TOKEN_COOKIE } from '@/lib/api';

export async function POST(req: Request) {
    const { email, password } = await req.json().catch(() => ({} as any));
    if (!email || !password) {
        return NextResponse.json({ ok: false, message: 'Completá email y contraseña' }, { status: 400 });
    }

    const token = await authLogin(email, password);
    if (!token) {
        return NextResponse.json({ ok: false, message: 'Credenciales inválidas' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(TOKEN_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
    });
    return res;
}
