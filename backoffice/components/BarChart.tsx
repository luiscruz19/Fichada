import { secondsToHHMM } from '@/lib/format';

export type BarDatum = { key: string; label: string; seconds: number };

// Gráfico de barras de horas por día. Usa alturas en PÍXELES (no %) para que las
// barras se vean siempre — el bug anterior era height:% contra un contenedor sin
// altura definida, que colapsaba las barras a líneas.
export function BarChart({ data, height = 128 }: { data: BarDatum[]; height?: number }) {
    const max = Math.max(1, ...data.map((d) => d.seconds));
    const gap = data.length > 31 ? 3 : 6;
    const showLabels = data.length <= 31;
    const showValues = data.length <= 16;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap, height }}>
                {data.map((d) => {
                    const barPx = d.seconds ? Math.max(Math.round((d.seconds / max) * (height - 16)), 4) : 0;
                    return (
                        <div key={d.key} title={`${d.label}: ${secondsToHHMM(d.seconds)}`}
                            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                            {showValues && (
                                <div style={{ fontSize: 9.5, color: 'var(--ink-3)', marginBottom: 3, height: 11, lineHeight: '11px', whiteSpace: 'nowrap' }}>
                                    {d.seconds ? secondsToHHMM(d.seconds) : ''}
                                </div>
                            )}
                            <div style={{ width: '100%', height: barPx, background: d.seconds ? 'var(--accent)' : 'transparent', borderRadius: '5px 5px 2px 2px', transition: 'height .2s' }} />
                        </div>
                    );
                })}
            </div>
            {showLabels && (
                <div style={{ display: 'flex', gap, marginTop: 6 }}>
                    {data.map((d) => (
                        <div key={d.key} style={{ flex: 1, minWidth: 0, fontSize: 9.5, color: 'var(--ink-3)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
