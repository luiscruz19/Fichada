import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BASE_PATH } from '@/lib/config';

export const metadata: Metadata = {
    title: 'Fichada — Panel de administración',
    description: 'Control de horas trabajadas y ubicaciones de fichaje',
    // Next lo enlaza en la raíz del dominio y el panel vive bajo /backoffice: sin esto da 404.
    manifest: `${BASE_PATH}/manifest.webmanifest`,
};

export const viewport: Viewport = {
    themeColor: '#1c2334',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
