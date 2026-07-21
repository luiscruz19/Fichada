'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PRESETS, presetRange, type PresetKey } from '@/lib/daterange';

// Selector de rango de fechas (desde/hasta + presets) para reportes/métricas.
// Navega con ?from=YYYY-MM-DD&to=YYYY-MM-DD (o sin params para "Todo").
export function DateRangePicker() {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const curFrom = sp.get('from') || '';
    const curTo = sp.get('to') || '';

    const [from, setFrom] = useState(curFrom);
    const [to, setTo] = useState(curTo);

    function go(fromKey: string | null, toKey: string | null) {
        const params = new URLSearchParams();
        if (fromKey) params.set('from', fromKey);
        if (toKey) params.set('to', toKey);
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    function activePreset(): PresetKey | null {
        for (const p of PRESETS) {
            const r = presetRange(p.key);
            if ((r.fromKey || '') === curFrom && (r.toKey || '') === curTo) return p.key;
        }
        return null;
    }
    const active = activePreset();
    const isCustom = !active && (!!curFrom || !!curTo);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 3, gap: 2 }}>
                {PRESETS.map((p) => {
                    const on = active === p.key || (p.key === 'all' && !curFrom && !curTo);
                    return (
                        <button key={p.key} onClick={() => { const r = presetRange(p.key); setFrom(r.fromKey || ''); setTo(r.toKey || ''); go(r.fromKey, r.toKey); }}
                            style={{
                                border: 'none', cursor: 'pointer', padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                                background: on ? 'var(--surface)' : 'transparent',
                                color: on ? 'var(--ink)' : 'var(--ink-3)',
                                boxShadow: on ? 'var(--shadow-1)' : 'none',
                            }}>{p.label}</button>
                    );
                })}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} style={dateInp(isCustom)} aria-label="Desde" />
                <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>→</span>
                <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} style={dateInp(isCustom)} aria-label="Hasta" />
                <button onClick={() => go(from || null, to || null)} disabled={!from && !to}
                    style={{ height: 34, padding: '0 14px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!from && !to) ? 0.5 : 1 }}>
                    Aplicar
                </button>
            </div>
        </div>
    );
}

function dateInp(highlight: boolean): React.CSSProperties {
    return {
        height: 34, borderRadius: 9, border: `1.5px solid ${highlight ? 'var(--accent)' : 'var(--hairline-2)'}`,
        background: 'var(--surface)', padding: '0 10px', fontSize: 13, color: 'var(--ink)',
    };
}
