import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getToken, apiGetJson, getAdminName } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Ic } from '@/components/icons';
import { Avatar, initials } from '@/components/ui';
import { MapaClient, type MapPoint } from '@/components/MapaClient';
import { DateRangePicker } from '@/components/DateRangePicker';
import { BarChart } from '@/components/BarChart';
import { EmpleadoShifts } from '@/components/EmpleadoShifts';
import { secondsToHHMM } from '@/lib/format';
import { computeMetrics, minToHHMM, TZ } from '@/lib/metrics';
import { resolveRange, rangeToApiQuery } from '@/lib/daterange';
import type { Shift, Employee } from '@/lib/types';

export const dynamic = 'force-dynamic';

function fmtAR(iso: string): string {
    return new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

export default async function ReporteEmpleadoPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string; to?: string; preset?: string } }) {
    if (!getToken()) redirect('/login');
    const id = Number(params.id);
    if (!Number.isFinite(id)) notFound();

    const range = resolveRange(searchParams, 'month');
    const apiQ = rangeToApiQuery(range.fromKey, range.toKey, { employee_id: String(id) });
    const [shiftsRes, empRes] = await Promise.all([
        apiGetJson<{ data: Shift[] }>(`/shifts/admin?${apiQ}`),
        apiGetJson<{ data: Employee }>(`/employees/admin/${id}`),
    ]);
    const shifts = shiftsRes?.data || [];
    const emp = empRes?.data;
    const name = emp ? `${emp.first_name} ${emp.last_name}` : (shifts[0]?.employee ? `${shifts[0].employee!.first_name} ${shifts[0].employee!.last_name}` : `Empleado #${id}`);
    const m = computeMetrics(shifts, range);

    const backHref = (() => {
        const p = new URLSearchParams();
        if (range.fromKey) p.set('from', range.fromKey);
        if (range.toKey) p.set('to', range.toKey);
        const qs = p.toString();
        return qs ? `/reportes?${qs}` : '/reportes';
    })();

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
                    <Link href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 12 }}>
                        {Ic.arrowLeft({ size: 16 })}Volver a Reportes
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar ini={initials(name)} size={44} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>{name}</h1>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>{emp?.email || ''}{emp?.expected_check_in ? ` · entrada esperada ${emp.expected_check_in.slice(0, 5)}` : ''} · <strong style={{ color: 'var(--ink-2)' }}>{range.label}</strong></p>
                        </div>
                    </div>
                    <div style={{ marginTop: 14 }}><DateRangePicker defaultPreset="month" /></div>
                </div>

                <div style={{ padding: '18px 28px 4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                    <Stat label="Horas del período" value={secondsToHHMM(m.totalSeconds)} />
                    <Stat label="Jornadas" value={String(m.shiftsCount)} />
                    <Stat label="Prom. por jornada" value={secondsToHHMM(m.avgShiftSeconds)} />
                    <Stat label="Entrada promedio" value={minToHHMM(m.avgCheckinMin)} />
                    <Stat label="Salida promedio" value={minToHHMM(m.avgCheckoutMin)} />
                    <Stat label="Puntualidad" value={m.punctualPct == null ? '—' : `${m.punctualPct}%`} />
                    <Stat label="Jornadas abiertas" value={String(m.openCount)} />
                </div>

                {/* Gráfico horas/día */}
                <div style={{ padding: '14px 28px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, padding: '16px 20px 14px', boxShadow: 'var(--shadow-1)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Horas por día</div>
                        <BarChart data={m.daily} />
                    </div>
                </div>

                {/* Mapa de sus fichadas */}
                <div style={{ padding: '4px 28px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 10px' }}>Ubicaciones de sus fichadas</div>
                    <div style={{ height: 380 }}><MapaClient points={points} /></div>
                </div>

                {/* Sus jornadas (clic para ver el detalle con mapa) */}
                <div style={{ padding: '14px 28px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Jornadas <span style={{ fontWeight: 500, color: 'var(--ink-3)' }}>· clic para ver el detalle en el mapa</span></div>
                    <EmpleadoShifts shifts={shifts} name={name} />
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
