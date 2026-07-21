import { redirect } from 'next/navigation';
import { getToken, apiGetJson, getAdminName } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Ic } from '@/components/icons';
import { ReportesPersonTable } from '@/components/ReportesPersonTable';
import { DateRangePicker } from '@/components/DateRangePicker';
import { secondsToHHMM } from '@/lib/format';
import { computeMetrics, minToHHMM } from '@/lib/metrics';
import { resolveRange, rangeToApiQuery } from '@/lib/daterange';
import { BASE_PATH } from '@/lib/config';
import type { Shift } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReportesPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
    if (!getToken()) redirect('/login');
    const range = resolveRange(searchParams);
    const apiQ = rangeToApiQuery(range.fromKey, range.toKey);
    const res = await apiGetJson<{ data: Shift[] }>(`/shifts/admin${apiQ ? `?${apiQ}` : ''}`);
    const shifts = res?.data || [];
    const m = computeMetrics(shifts, range);
    const maxDaily = Math.max(1, ...m.daily.map((d) => d.seconds));
    const hasRange = !!(range.fromKey || range.toKey);
    const exportQ = apiQ;

    return (
        <div className="admin">
            <Sidebar adminName={await getAdminName()} />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
                <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Reportes</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-3)' }}>Métricas de horarios · <strong style={{ color: 'var(--ink-2)' }}>{range.label}</strong> · hora AR (UTC−3)</p>
                    </div>
                    <div style={{ display: 'flex', gap: 9 }}>
                        <a className="seg" href={`${BASE_PATH}/api/export?format=csv${exportQ ? `&${exportQ}` : ''}`}>{Ic.doc({ size: 16 })}CSV</a>
                        <a className="seg" href={`${BASE_PATH}/api/export?format=xlsx${exportQ ? `&${exportQ}` : ''}`}>{Ic.doc({ size: 16 })}Excel</a>
                        <a className="seg" href={`${BASE_PATH}/api/export?format=pdf${exportQ ? `&${exportQ}` : ''}`}>{Ic.doc({ size: 16 })}PDF</a>
                    </div>
                </div>

                {/* Selector de rango de fechas */}
                <div style={{ padding: '14px 28px 2px' }}>
                    <DateRangePicker />
                </div>

                {/* Métricas generales */}
                <div style={{ padding: '14px 28px 4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                    <Stat label={hasRange ? 'Horas del período' : 'Total horas del equipo'} value={secondsToHHMM(m.totalSeconds)} />
                    {hasRange ? (
                        <Stat label="Empleados con fichadas" value={String(m.employeesCount)} />
                    ) : (
                        <>
                            <Stat label="Horas hoy" value={secondsToHHMM(m.secondsToday)} />
                            <Stat label="Horas últimos 7 días" value={secondsToHHMM(m.secondsWeek)} />
                        </>
                    )}
                    <Stat label="Jornadas" value={String(m.shiftsCount)} />
                    <Stat label="Promedio por jornada" value={secondsToHHMM(m.avgShiftSeconds)} />
                    <Stat label="Entrada promedio" value={minToHHMM(m.avgCheckinMin)} />
                    <Stat label="Salida promedio" value={minToHHMM(m.avgCheckoutMin)} />
                    <Stat label="Puntualidad" value={m.punctualPct == null ? '—' : `${m.punctualPct}%`} tone={punctTone(m.punctualPct)} />
                    <Stat label="Jornadas abiertas" value={String(m.openCount)} tone={m.openCount ? 'warn' : undefined} />
                </div>

                {/* Gráfico: horas por día */}
                <div style={{ padding: '14px 28px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, padding: '16px 20px 12px', boxShadow: 'var(--shadow-1)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Horas trabajadas por día{hasRange ? '' : ' · últimos 14 días'}</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: m.daily.length > 31 ? 3 : 6, height: 132 }}>
                            {m.daily.map((d) => {
                                const hPct = Math.round((d.seconds / maxDaily) * 100);
                                return (
                                    <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                        <div style={{ fontSize: 9.5, color: 'var(--ink-3)', height: 12 }}>{d.seconds && m.daily.length <= 20 ? secondsToHHMM(d.seconds) : ''}</div>
                                        <div title={`${d.label}: ${secondsToHHMM(d.seconds)}`}
                                            style={{ width: '100%', height: `${Math.max(hPct, d.seconds ? 4 : 0)}%`, minHeight: d.seconds ? 4 : 0, background: 'var(--accent)', borderRadius: '5px 5px 2px 2px', transition: 'height .2s' }} />
                                        <div style={{ fontSize: 9.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{m.daily.length <= 31 ? d.label : ''}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Métricas por persona (clic para ver el reporte individual) */}
                <div style={{ padding: '0 28px 6px', fontSize: 12.5, color: 'var(--ink-3)' }}>Reporte por persona · hacé clic en un empleado para ver su detalle</div>
                <div style={{ padding: '4px 28px 24px' }}>
                    <ReportesPersonTable rows={m.perPerson} range={{ from: range.fromKey, to: range.toKey }} />
                </div>
            </main>
        </div>
    );
}

function punctTone(pct: number | null): 'ok' | 'warn' | undefined {
    if (pct == null) return undefined;
    return pct >= 80 ? 'ok' : 'warn';
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
    const color = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : undefined;
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '14px 18px', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
            <div className="tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color }}>{value}</div>
        </div>
    );
}
