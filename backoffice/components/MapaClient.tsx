'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureGoogleMaps, circleIcon, MARK_COLOR as COLOR } from '@/lib/gmaps';
import { Ic } from './icons';

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
    const heatRef = useRef<any>(null);
    const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
    const [mode, setMode] = useState<'pins' | 'heat'>('pins');
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

    // (Re)dibuja según filtro/modo/puntos.
    useEffect(() => {
        if (status !== 'ready' || !mapRef.current) return;
        const g = (window as any).google;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        if (heatRef.current) { heatRef.current.setMap(null); heatRef.current = null; }

        const visible = points.filter((p) => filter === 'all' || p.kind === filter);
        if (visible.length === 0) return;

        const bounds = new g.maps.LatLngBounds();
        visible.forEach((p) => bounds.extend(new g.maps.LatLng(p.lat, p.lng)));

        if (mode === 'heat' && g.maps.visualization) {
            heatRef.current = new g.maps.visualization.HeatmapLayer({
                data: visible.map((p) => new g.maps.LatLng(p.lat, p.lng)),
                radius: 30,
                opacity: 0.8,
            });
            heatRef.current.setMap(mapRef.current);
        } else {
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
            }
        }

        if (visible.length === 1) {
            mapRef.current.setCenter(bounds.getCenter());
            mapRef.current.setZoom(16);
        } else {
            mapRef.current.fitBounds(bounds, 64);
        }
    }, [filter, points, status, mode]);

    const counts = {
        all: points.length,
        in: points.filter((p) => p.kind === 'in').length,
        out: points.filter((p) => p.kind === 'out').length,
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 3, gap: 2 }}>
                    <SegBtn active={filter === 'all'} onClick={() => setFilter('all')}>Todas ({counts.all})</SegBtn>
                    <SegBtn active={filter === 'in'} onClick={() => setFilter('in')}>Entradas ({counts.in})</SegBtn>
                    <SegBtn active={filter === 'out'} onClick={() => setFilter('out')}>Salidas ({counts.out})</SegBtn>
                </div>

                <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 3, gap: 2 }}>
                    <SegBtn active={mode === 'pins'} onClick={() => setMode('pins')}>{Ic.pin({ size: 14 })}Pines</SegBtn>
                    <SegBtn active={mode === 'heat'} onClick={() => setMode('heat')}>{Ic.fire({ size: 14 })}Calor</SegBtn>
                </div>

                {mode === 'pins' && (
                    <div style={{ display: 'flex', gap: 14, marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-2)' }}>
                        <Legend color={COLOR.in} label="Entrada" />
                        <Legend color={COLOR.out} label="Salida" />
                    </div>
                )}
                {mode === 'heat' && (
                    <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-3)' }}>Zonas con más fichadas = más intensidad</div>
                )}
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

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} style={{
            border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 5,
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
