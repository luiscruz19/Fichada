import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/config';

// PWA manifest del panel (del handoff de Claude Design). Los iconos viven en public/icons
// y se prefijan con BASE_PATH porque el panel se sirve bajo /backoffice.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Fichada — Fichaje de horarios',
        short_name: 'Fichada',
        description: 'Registrá tu entrada y salida. Hora del servidor y ubicación verificada.',
        lang: 'es-AR',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1c2334',
        theme_color: '#1c2334',
        icons: [
            { src: `${BASE_PATH}/icons/favicon-32.png`, sizes: '32x32', type: 'image/png' },
            { src: `${BASE_PATH}/icons/favicon-48.png`, sizes: '48x48', type: 'image/png' },
            { src: `${BASE_PATH}/icons/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
            { src: `${BASE_PATH}/icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: `${BASE_PATH}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
