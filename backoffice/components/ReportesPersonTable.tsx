'use client';

import { useRouter } from 'next/navigation';
import { Ic } from './icons';
import { Avatar, initials } from './ui';
import { secondsToHHMM } from '@/lib/format';
import { minToHHMM, type PersonMetric } from '@/lib/metrics';

function punctColor(pct: number | null): string {
    if (pct == null) return 'var(--ink-3)';
    return pct >= 80 ? 'var(--ok)' : pct >= 50 ? 'var(--warn)' : 'var(--danger)';
}

// Tabla por persona con filas clickeables → reporte individual del empleado.
export function ReportesPersonTable({ rows }: { rows: PersonMetric[] }) {
    const router = useRouter();

    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                    <thead><tr>
                        {['Empleado', 'Jornadas', 'Horas', 'Prom./jornada', 'Entrada prom.', 'Puntualidad', 'Abiertas', ''].map((h, i) => (
                            <th key={i} className="th" style={{ paddingTop: 14, textAlign: i === 0 ? 'left' : i === 7 ? 'right' : 'right' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td className="td" colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '28px 0' }}>Sin datos: todavía no hay fichadas.</td></tr>
                        )}
                        {rows.map((r) => (
                            <tr key={r.id} className="row" style={{ cursor: 'pointer' }} onClick={() => router.push(`/reportes/${r.id}`)}>
                                <td className="td"><div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}><Avatar ini={initials(r.name)} size={28} />{r.name}</div></td>
                                <td className="td tnum" style={{ textAlign: 'right' }}>{r.count}</td>
                                <td className="td tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{secondsToHHMM(r.seconds)}</td>
                                <td className="td tnum" style={{ textAlign: 'right', color: 'var(--ink-2)' }}>{secondsToHHMM(r.avgSeconds)}</td>
                                <td className="td tnum" style={{ textAlign: 'right', color: 'var(--ink-2)' }}>{minToHHMM(r.avgCheckinMin)}</td>
                                <td className="td tnum" style={{ textAlign: 'right', color: punctColor(r.punctualPct) }}>{r.punctualPct == null ? '—' : `${r.punctualPct}%`}</td>
                                <td className="td tnum" style={{ textAlign: 'right', color: r.open ? 'var(--warn)' : 'var(--ink-3)' }}>{r.open || '—'}</td>
                                <td className="td" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{Ic.chevD({ size: 16, style: { transform: 'rotate(-90deg)' } })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
