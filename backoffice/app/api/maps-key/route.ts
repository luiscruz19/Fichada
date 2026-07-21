import { NextResponse } from 'next/server';

// La API key de Google Maps se lee en runtime (env del server), NO se hornea en el
// bundle. Así el deploy la toma del .env sin rebuildear la imagen del backoffice.
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ key: process.env.GOOGLE_MAPS_API_KEY || '' });
}
