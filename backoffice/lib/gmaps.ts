import { BASE_PATH } from './config';

// Carga el SDK de Google Maps una sola vez para toda la app. La API key se pide en
// runtime a nuestro propio route handler (no se hornea en el bundle).
let promise: Promise<any> | null = null;

export function ensureGoogleMaps(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
        return Promise.resolve((window as any).google);
    }
    if (promise) return promise;
    promise = (async () => {
        const res = await fetch(`${BASE_PATH}/api/maps-key`);
        const { key } = await res.json();
        if (!key) throw new Error('nokey');
        await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('load'));
            document.head.appendChild(s);
        });
        return (window as any).google;
    })();
    return promise;
}

export const MARK_COLOR = { in: '#16a34a', out: '#dc2626' };

export function circleIcon(g: any, kind: 'in' | 'out', scale = 7) {
    return {
        path: g.maps.SymbolPath.CIRCLE,
        scale,
        fillColor: MARK_COLOR[kind],
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
    };
}
