'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureGoogleMaps, circleIcon, MARK_COLOR } from '@/lib/gmaps';

export type FichadaPoint = { lat: number; lng: number; kind: 'in' | 'out'; label: string };

// Mini-mapa de Google Maps para el detalle de una fichada: pines de entrada (verde)
// y salida (rojo). Si no hay key o falla, cae a mostrar las coordenadas en texto.
export function FichadaMap({ points, height = 170 }: { points: FichadaPoint[]; height?: number }) {
    const el = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'nokey' | 'error'>('loading');

    useEffect(() => {
        let cancelled = false;
        if (points.length === 0) { setStatus('ready'); return; }
        (async () => {
            try {
                const g = await ensureGoogleMaps();
                if (cancelled || !el.current) return;
                const map = new g.maps.Map(el.current, {
                    zoom: 16,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    gestureHandling: 'cooperative',
                });
                const bounds = new g.maps.LatLngBounds();
                const info = new g.maps.InfoWindow();
                for (const p of points) {
                    const marker = new g.maps.Marker({
                        position: { lat: p.lat, lng: p.lng },
                        map,
                        icon: circleIcon(g, p.kind),
                        title: p.label,
                    });
                    marker.addListener('click', () => {
                        info.setContent(`<div style="font-family:system-ui;font-size:12.5px"><span style="color:${MARK_COLOR[p.kind]};font-weight:600">●</span> ${p.label}</div>`);
                        info.open(map, marker);
                    });
                    bounds.extend(marker.getPosition());
                }
                if (points.length === 1) { map.setCenter(bounds.getCenter()); map.setZoom(16); }
                else map.fitBounds(bounds, 48);
                setStatus('ready');
            } catch (e: any) {
                if (!cancelled) setStatus(e?.message === 'nokey' ? 'nokey' : 'error');
            }
        })();
        return () => { cancelled = true; };
    }, [points]);

    const coordsText = points.map((p) => `${p.kind === 'in' ? 'Entrada' : 'Salida'}: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`).join(' · ');

    if (points.length === 0) {
        return (
            <div style={{ height, borderRadius: 12, marginTop: 6, border: '1px dashed var(--hairline-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 13, background: 'var(--surface-2)' }}>
                Sin ubicación registrada
            </div>
        );
    }

    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ position: 'relative', height, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
                <div ref={el} style={{ position: 'absolute', inset: 0, background: 'var(--surface-2)' }} />
                {status !== 'ready' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12, fontSize: 12.5, color: 'var(--ink-3)' }}>
                        {status === 'loading' && 'Cargando mapa…'}
                        {status === 'nokey' && coordsText}
                        {status === 'error' && coordsText}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                {points.some((p) => p.kind === 'in') && <Legend color={MARK_COLOR.in} label="Entrada" />}
                {points.some((p) => p.kind === 'out') && <Legend color={MARK_COLOR.out} label="Salida" />}
            </div>
        </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: '0 0 0 1px var(--hairline)' }} />
            {label}
        </span>
    );
}
