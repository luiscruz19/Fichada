import { redirect } from 'next/navigation';
import { getToken, apiGetJson } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Ic } from '@/components/icons';
import { Avatar, initials } from '@/components/ui';
import { secondsToHHMM } from '@/lib/format';
import { BASE_PATH } from '@/lib/config';
import type { Shift } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
    if (!getToken()) redirect('/login');
    const res = await apiGetJson<{ data: Shift[] }>('/shifts/admin');
    const shifts = res?.data || [];

    const byEmp = new Map<number, { name: string; count: number; seconds: number; open: number }>();
    for (const s of shifts) {
        const name = s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : `#${s.employee_id}`;
        const cur = byEmp.get(s.employee_id) || { name, count: 0, seconds: 0, open: 0 };
        cur.count++;
        cur.seconds += s.worked_seconds || 0;
        if (s.status === 'open') cur.open++;
        byEmp.set(s.employee_id, cur);
    }
    const rows = [...byEmp.values()].sort((a, b) => b.seconds - a.seconds);
    const totalSeconds = rows.reduce((a, r) => a + r.seconds, 0);

    return (
        <div className="admin">
            <Sidebar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
                <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Reportes</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-3)' }}>Horas trabajadas por persona · hora oficial del servidor</p>
                    </div>
                    <div style={{ display: 'flex', gap: 9 }}>
                        <a className="seg" href={`${BASE_PATH}/api/export?format=csv`}>{Ic.doc({ size: 16 })}CSV</a>
                        <a className="seg" href={`${BASE_PATH}/api/export?format=xlsx`}>{Ic.doc({ size: 16 })}Excel</a>
                        <a className="seg" href={`${BASE_PATH}/api/export?format=pdf`}>{Ic.doc({ size: 16 })}PDF</a>
                    </div>
                </div>

                <div style={{ padding: '18px 28px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <Stat label="Total horas del equipo" value={secondsToHHMM(totalSeconds)} />
                    <Stat label="Empleados con fichadas" value={String(rows.length)} />
                    <Stat label="Jornadas registradas" value={String(shifts.length)} />
                </div>

                <div style={{ padding: '0 28px 24px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr>
                                {['Empleado', 'Jornadas', 'Horas trabajadas', 'Abiertas'].map((h, i) => (
                                    <th key={i} className="th" style={{ paddingTop: 14, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr><td className="td" colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '28px 0' }}>Sin datos: todavía no hay fichadas.</td></tr>
                                )}
                                {rows.map((r, i) => (
                                    <tr key={i} className="row">
                                        <td className="td"><div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}><Avatar ini={initials(r.name)} size={28} />{r.name}</div></td>
                                        <td className="td tnum" style={{ textAlign: 'right' }}>{r.count}</td>
                                        <td className="td tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{secondsToHHMM(r.seconds)}</td>
                                        <td className="td tnum" style={{ textAlign: 'right', color: r.open ? 'var(--warn)' : 'var(--ink-3)' }}>{r.open || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '14px 18px', minWidth: 180, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
            <div className="tnum" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{value}</div>
        </div>
    );
}
