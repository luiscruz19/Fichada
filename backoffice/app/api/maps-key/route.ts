import { NextResponse } from 'next/server';

// La key se lee en runtime: así un deploy la cambia sin reconstruir la imagen.
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ key: process.env.GOOGLE_MAPS_API_KEY || '' });
}
