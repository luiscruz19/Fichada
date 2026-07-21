'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureGoogleMaps, circleIcon, MARK_COLOR as COLOR } from '@/lib/gmaps';

export type MapPoint = {
    lat: number;
    lng: number;
    kind: 'in' | 'out';
    name: string;
    time: string;
    shiftId: number;
};

export function MapaClient({ points }: { points: MapPoint[] }) {
    const mapEl = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
    const [status, setStatus] = useState<'loading' | 'ready' | 'nokey' | 'error'>('loading');

    // Inicializa el mapa una vez.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const g = await ensureGoogleMaps();
                if (cancelled || !mapEl.current) return;
                mapRef.current = new g.maps.Map(mapEl.current, {
                    center: { lat: -31.4, lng: -64.2 },
                    zoom: 5,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                });
                setStatus('ready');
            } catch (e: any) {
                if (!cancelled) setStatus(e?.message === 'nokey' ? 'nokey' : 'error');
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // (Re)dibuja los marcadores cuando cambia el filtro o los puntos.
    useEffect(() => {
        if (status !== 'ready' || !mapRef.current) return;
        const g = (window as any).google;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const visible = points.filter((p) => filter === 'all' || p.kind === filter);
        const bounds = new g.maps.LatLngBounds();
        const info = new g.maps.InfoWindow();

        for (const p of visible) {
            const marker = new g.maps.Marker({
                position: { lat: p.lat, lng: p.lng },
                map: mapRef.current,
                icon: circleIcon(g, p.kind),
                title: `${p.name} · ${p.kind === 'in' ? 'Entrada' : 'Salida'}`,
            });
            marker.addListener('click', () => {
                info.setContent(
                    `<div style="font-family:system-ui;font-size:13px;line-height:1.5;min-width:150px">
                        <strong>${p.name}</strong><br/>
                        <span style="color:${COLOR[p.kind]};font-weight:600">${p.kind === 'in' ? '● Entrada' : '● Salida'}</span><br/>
                        <span style="color:#666">${p.time}</span>
                     </div>`
                );
                info.open(mapRef.current, marker);
            });
            markersRef.current.push(marker);
            bounds.extend(marker.getPosition());
        }

        if (visible.length === 1) {
            mapRef.current.setCenter(bounds.getCenter());
            mapRef.current.setZoom(16);
        } else if (visible.length > 1) {
            mapRef.current.fitBounds(bounds, 64);
        }
    }, [filter, points, status]);

    const counts = {
        all: points.length,
        in: points.filter((p) => p.kind === 'in').length,
        out: points.filter((p) => p.kind === 'out').length,
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 3, gap: 2 }}>
                    <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>Todas ({counts.all})</FilterBtn>
                    <FilterBtn active={filter === 'in'} onClick={() => setFilter('in')}>Entradas ({counts.in})</FilterBtn>
                    <FilterBtn active={filter === 'out'} onClick={() => setFilter('out')}>Salidas ({counts.out})</FilterBtn>
                </div>
                <div style={{ display: 'flex', gap: 14, marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-2)' }}>
                    <Legend color={COLOR.in} label="Entrada" />
                    <Legend color={COLOR.out} label="Salida" />
                </div>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: 380, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-1)', background: 'var(--surface-2)' }}>
                <div ref={mapEl} style={{ position: 'absolute', inset: 0 }} />
                {status !== 'ready' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, color: 'var(--ink-3)', fontSize: 14 }}>
                        {status === 'loading' && 'Cargando mapa…'}
                        {status === 'nokey' && 'Falta configurar la API key de Google Maps (GOOGLE_MAPS_API_KEY).'}
                        {status === 'error' && 'No se pudo cargar Google Maps. Revisá la API key y sus restricciones.'}
                    </div>
                )}
                {status === 'ready' && points.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 14, pointerEvents: 'none' }}>
                        Todavía no hay fichadas con ubicación registrada.
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} style={{
            border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: active ? 'var(--surface)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-3)',
            boxShadow: active ? 'var(--shadow-1)' : 'none',
        }}>{children}</button>
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
