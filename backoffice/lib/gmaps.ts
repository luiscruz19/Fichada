import { BASE_PATH } from './config';

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
            // Sin loading=async, Google avisa por consola.
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async`;
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

export function colorDensidad(ratio: number): string {
    const paradas: [number, [number, number, number]][] = [
        [0, [34, 197, 94]],
        [0.45, [234, 179, 8]],
        [0.75, [249, 115, 22]],
        [1, [220, 38, 38]],
    ];
    const r = Math.min(1, Math.max(0, ratio));
    for (let i = 1; i < paradas.length; i++) {
        const [p1, c1] = paradas[i - 1];
        const [p2, c2] = paradas[i];
        if (r <= p2) {
            const f = p2 === p1 ? 0 : (r - p1) / (p2 - p1);
            const mix = c1.map((v, j) => Math.round(v + (c2[j] - v) * f));
            return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
        }
    }
    return 'rgb(220, 38, 38)';
}

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
