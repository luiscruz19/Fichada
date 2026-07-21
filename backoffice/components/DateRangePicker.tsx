'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PRESETS, presetRange, type PresetKey } from '@/lib/daterange';

// Selector de rango de fechas (desde/hasta + presets) para reportes/métricas/historial.
// `defaultPreset` es el rango que se aplica cuando no hay parámetros en la URL (p.ej.
// 'month' para arrancar en "Este mes"). "Todo" navega con ?preset=all.
export function DateRangePicker({ defaultPreset = 'all' }: { defaultPreset?: PresetKey }) {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const curFrom = sp.get('from') || '';
    const curTo = sp.get('to') || '';
    const curPreset = sp.get('preset') || '';

    // Rango efectivo (considerando el default cuando no hay params) para el highlight.
    let effFrom = curFrom, effTo = curTo, isAll = curPreset === 'all';
    if (!curFrom && !curTo && !curPreset) {
        if (defaultPreset === 'all') isAll = true;
        else { const r = presetRange(defaultPreset); effFrom = r.fromKey || ''; effTo = r.toKey || ''; }
    }

    const [from, setFrom] = useState(effFrom);
    const [to, setTo] = useState(effTo);

    function goPreset(key: PresetKey) {
        if (key === 'all') { router.push(`${pathname}?preset=all`); return; }
        const r = presetRange(key);
        const p = new URLSearchParams();
        if (r.fromKey) p.set('from', r.fromKey);
        if (r.toKey) p.set('to', r.toKey);
        setFrom(r.fromKey || ''); setTo(r.toKey || '');
        router.push(`${pathname}?${p.toString()}`);
    }

    function goCustom() {
        const p = new URLSearchParams();
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        const qs = p.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    function activePreset(): PresetKey | null {
        if (isAll) return 'all';
        for (const p of PRESETS) {
            if (p.key === 'all') continue;
            const r = presetRange(p.key);
            if ((r.fromKey || '') === effFrom && (r.toKey || '') === effTo) return p.key;
        }
        return null;
    }
    const active = activePreset();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 3, gap: 2 }}>
                {PRESETS.map((p) => {
                    const on = active === p.key;
                    return (
                        <button key={p.key} onClick={() => goPreset(p.key)}
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
                <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} style={dateInp(active === null)} aria-label="Desde" />
                <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>→</span>
                <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} style={dateInp(active === null)} aria-label="Hasta" />
                <button onClick={goCustom} disabled={!from && !to}
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
