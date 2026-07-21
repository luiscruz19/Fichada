import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiGetJson, getAdminName } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Ic } from '@/components/icons';
import { Avatar, initials, ChipTone } from '@/components/ui';
import { MapaClient, type MapPoint } from '@/components/MapaClient';
import { secondsToHHMM, fmtTime, fmtDateShort } from '@/lib/format';
import { computeMetrics, minToHHMM, TZ } from '@/lib/metrics';
import type { Shift, Employee } from '@/lib/types';

export const dynamic = 'force-dynamic';

function fmtAR(iso: string): string {
    return new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

export default async function ReporteEmpleadoPage({ params }: { params: { id: string } }) {
    if (!getToken()) redirect('/login');
    const id = Number(params.id);
    if (!Number.isFinite(id)) notFound();

    const [shiftsRes, empRes] = await Promise.all([
        apiGetJson<{ data: Shift[] }>(`/shifts/admin?employee_id=${id}`),
        apiGetJson<{ data: Employee }>(`/employees/admin/${id}`),
    ]);
    const shifts = shiftsRes?.data || [];
    const emp = empRes?.data;
    const name = emp ? `${emp.first_name} ${emp.last_name}` : (shifts[0]?.employee ? `${shifts[0].employee!.first_name} ${shifts[0].employee!.last_name}` : `Empleado #${id}`);
    const m = computeMetrics(shifts);
    const maxDaily = Math.max(1, ...m.daily.map((d) => d.seconds));

    const points: MapPoint[] = [];
    for (const s of shifts) {
        if (s.check_in_lat != null && s.check_in_lng != null) points.push({ lat: Number(s.check_in_lat), lng: Number(s.check_in_lng), kind: 'in', name, time: fmtAR(s.check_in), shiftId: s.id });
        if (s.check_out && s.check_out_lat != null && s.check_out_lng != null) points.push({ lat: Number(s.check_out_lat), lng: Number(s.check_out_lng), kind: 'out', name, time: fmtAR(s.check_out), shiftId: s.id });
    }

    return (
        <div className="admin">
            <Sidebar adminName={await getAdminName()} />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
                <div style={{ padding: '20px 28px 0' }}>
                    <Link href="/reportes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 12 }}>
                        {Ic.arrowLeft({ size: 16 })}Volver a Reportes
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar ini={initials(name)} size={44} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>{name}</h1>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>{emp?.email || ''}{emp?.expected_check_in ? ` · entrada esperada ${emp.expected_check_in.slice(0, 5)}` : ''}</p>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '18px 28px 4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                    <Stat label="Total horas" value={secondsToHHMM(m.totalSeconds)} />
                    <Stat label="Jornadas" value={String(m.shiftsCount)} />
                    <Stat label="Horas hoy" value={secondsToHHMM(m.secondsToday)} />
                    <Stat label="Últimos 7 días" value={secondsToHHMM(m.secondsWeek)} />
                    <Stat label="Prom. por jornada" value={secondsToHHMM(m.avgShiftSeconds)} />
                    <Stat label="Entrada promedio" value={minToHHMM(m.avgCheckinMin)} />
                    <Stat label="Salida promedio" value={minToHHMM(m.avgCheckoutMin)} />
                    <Stat label="Puntualidad" value={m.punctualPct == null ? '—' : `${m.punctualPct}%`} />
                </div>

                {/* Gráfico horas/día */}
                <div style={{ padding: '14px 28px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, padding: '16px 20px 12px', boxShadow: 'var(--shadow-1)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Horas por día · últimos 14 días</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                            {m.daily.map((d) => {
                                const hPct = Math.round((d.seconds / maxDaily) * 100);
                                return (
                                    <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                        <div title={`${d.label}: ${secondsToHHMM(d.seconds)}`} style={{ width: '100%', height: `${Math.max(hPct, d.seconds ? 4 : 0)}%`, minHeight: d.seconds ? 4 : 0, background: 'var(--accent)', borderRadius: '5px 5px 2px 2px' }} />
                                        <div style={{ fontSize: 9.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{d.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Mapa de sus fichadas */}
                <div style={{ padding: '4px 28px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 10px' }}>Ubicaciones de sus fichadas</div>
                    <div style={{ height: 380 }}><MapaClient points={points} /></div>
                </div>

                {/* Sus jornadas */}
                <div style={{ padding: '14px 28px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Jornadas</div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                                <thead><tr>
                                    {['Fecha', 'Entrada', 'Salida', 'Pausas', 'Total', 'Estado', 'Ubicación'].map((h, i) => (
                                        <th key={i} className="th" style={{ paddingTop: 14, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {shifts.length === 0 && (
                                        <tr><td className="td" colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '28px 0' }}>Este empleado todavía no tiene fichadas.</td></tr>
                                    )}
                                    {shifts.map((s) => {
                                        const pausas = (s.breaks || []).reduce((a, b) => a + (b.duration_seconds || 0), 0);
                                        const hasIn = s.check_in_lat != null && s.check_in_lng != null;
                                        const hasOut = s.check_out_lat != null && s.check_out_lng != null;
                                        return (
                                            <tr key={s.id} className="row">
                                                <td className="td" style={{ color: 'var(--ink-2)' }}>{fmtDateShort(s.check_in)}</td>
                                                <td className="td tnum" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtTime(s.check_in) || '—'}</td>
                                                <td className="td tnum" style={{ textAlign: 'right', fontWeight: 600, color: s.check_out ? 'var(--ink)' : 'var(--warn)' }}>{fmtTime(s.check_out) || '—'}</td>
                                                <td className="td tnum" style={{ textAlign: 'right', color: 'var(--ink-2)' }}>{pausas ? secondsToHHMM(pausas) : '—'}</td>
                                                <td className="td tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{secondsToHHMM(s.worked_seconds)}</td>
                                                <td className="td" style={{ textAlign: 'right' }}><ChipTone tone={s.status === 'open' ? 'warn' : 'ok'}>{s.status === 'open' ? 'Abierta' : 'Completa'}</ChipTone></td>
                                                <td className="td" style={{ textAlign: 'right' }}>
                                                    <span style={{ display: 'inline-flex', gap: 5, justifyContent: 'flex-end' }}>
                                                        <span title="Entrada" style={{ color: hasIn ? '#16a34a' : 'var(--hairline-2)' }}>{Ic.pin({ size: 15 })}</span>
                                                        <span title="Salida" style={{ color: hasOut ? '#dc2626' : 'var(--hairline-2)' }}>{Ic.pin({ size: 15 })}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{value}</div>
        </div>
    );
}
