'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from './icons';
import { ChipTone, Avatar, initials } from './ui';
import { px } from '@/lib/client';
import type { Employee } from '@/lib/types';

type Draft = Partial<Employee> & { id?: number };

export function EquipoClient({ employees }: { employees: Employee[] }) {
    const router = useRouter();
    const [editing, setEditing] = useState<Draft | null>(null);
    const [busy, setBusy] = useState(false);

    async function action(fn: () => Promise<any>) {
        setBusy(true);
        try { await fn(); router.refresh(); } finally { setBusy(false); }
    }

    return (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '100vh' }}>
            <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Equipo</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-3)' }}>Empleados, roles, jornada y acceso</p>
                </div>
                <button className="btn-primary" onClick={() => setEditing({ role: 'employee' })}>{Ic.plus({ size: 16 })}Invitar empleado</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 24px' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                            {['Empleado', 'Email', 'Rol', 'Jornada', 'Estado', ''].map((h, i) => (
                                <th key={i} className="th" style={{ paddingTop: 14, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {employees.length === 0 && (
                                <tr><td className="td" colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '28px 0' }}>No hay empleados. Invitá al primero.</td></tr>
                            )}
                            {employees.map((e) => {
                                const name = `${e.first_name} ${e.last_name}`;
                                const inactive = e.status === 'inactive';
                                return (
                                    <tr key={e.id} className="row" style={{ opacity: inactive ? 0.55 : 1 }}>
                                        <td className="td"><div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}><Avatar ini={initials(name)} size={28} />{name}</div></td>
                                        <td className="td" style={{ color: 'var(--ink-2)' }}>{e.email}</td>
                                        <td className="td"><ChipTone tone={e.role === 'admin' ? 'accent' : 'neutral'}>{e.role === 'admin' ? 'Administrador' : 'Empleado'}</ChipTone></td>
                                        <td className="td tnum" style={{ color: 'var(--ink-2)' }}>{e.target_hours ? `${e.target_hours} h` : '—'}</td>
                                        <td className="td"><ChipTone tone={inactive ? 'neutral' : 'ok'}>{inactive ? 'Baja' : 'Activo'}</ChipTone></td>
                                        <td className="td" style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                                <button title="Editar" onClick={() => setEditing(e)} style={iconBtn}>{Ic.edit({ size: 16 })}</button>
                                                <button title="Revocar sesión (kill switch)" disabled={busy}
                                                    onClick={() => action(() => px(`/employees/admin/${e.id}/kill-switch`, { method: 'POST', body: '{}' }))}
                                                    style={{ ...iconBtn, color: 'var(--warn)' }}>{Ic.power({ size: 16 })}</button>
                                                {inactive ? (
                                                    <button title="Reactivar" disabled={busy}
                                                        onClick={() => action(() => px(`/employees/admin/${e.id}/reactivate`, { method: 'PATCH', body: '{}' }))}
                                                        style={{ ...iconBtn, color: 'var(--ok)' }}>{Ic.refresh({ size: 16 })}</button>
                                                ) : (
                                                    <button title="Dar de baja" disabled={busy}
                                                        onClick={() => action(() => px(`/employees/admin/${e.id}/deactivate`, { method: 'PATCH', body: '{}' }))}
                                                        style={{ ...iconBtn, color: 'var(--danger)' }}>{Ic.trash({ size: 16 })}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '12px 4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Ic.power({ size: 13 })}El kill switch revoca el dispositivo vinculado: el empleado deberá volver a iniciar sesión.
                </p>
            </div>

            {editing && (
                <EmployeeDrawer draft={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />
            )}
        </main>
    );
}

function EmployeeDrawer({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
    const isNew = !draft.id;
    const [form, setForm] = useState<Draft>({
        first_name: draft.first_name || '',
        last_name: draft.last_name || '',
        email: draft.email || '',
        role: draft.role || 'employee',
        target_hours: draft.target_hours ?? undefined,
        expected_check_in: draft.expected_check_in || '',
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ email: string; temp: string; sent: boolean } | null>(null);
    const set = (k: keyof Draft, v: any) => setForm((f) => ({ ...f, [k]: v }));

    async function save() {
        setBusy(true); setError(null);
        const body: any = {
            first_name: form.first_name, last_name: form.last_name, email: form.email, role: form.role,
        };
        if (form.target_hours !== undefined && form.target_hours !== null && `${form.target_hours}` !== '') body.target_hours = Number(form.target_hours);
        if (form.expected_check_in) body.expected_check_in = form.expected_check_in;

        const r = isNew
            ? await px('/employees/admin', { method: 'POST', body: JSON.stringify(body) })
            : await px(`/employees/admin/${draft.id}`, { method: 'PUT', body: JSON.stringify(body) });

        setBusy(false);
        if (!r.ok) { setError(r.json?.message || 'No se pudo guardar'); return; }
        if (isNew && r.json?.temp_password) {
            setResult({ email: form.email || '', temp: r.json.temp_password, sent: !!r.json?.email_sent });
            return;
        }
        onSaved();
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.02 260 / 0.28)', zIndex: 20, animation: 'fch-fade 0.18s' }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 392, background: 'var(--surface)', zIndex: 21, boxShadow: '-12px 0 40px oklch(0.2 0.02 260 / 0.16)', display: 'flex', flexDirection: 'column', animation: 'fch-drawer 0.26s cubic-bezier(0.2,0.9,0.2,1)' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{result ? 'Empleado invitado' : (isNew ? 'Invitar empleado' : 'Editar empleado')}</div>
                    <button onClick={result ? onSaved : onClose} style={{ color: 'var(--ink-3)', padding: 4 }}>{Ic.x({ size: 22 })}</button>
                </div>

                {result ? (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ background: 'var(--ok-tint)', color: 'var(--ok)', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                                {Ic.check({ size: 16 })}Cuenta creada y activada
                            </div>
                            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>
                                {result.sent
                                    ? 'Le enviamos la invitación por email. También podés pasarle estas credenciales:'
                                    : 'No se pudo enviar el email (SMTP no configurado). Pasale estas credenciales al empleado para que entre a la app:'}
                            </p>
                            <div style={{ border: '1px solid var(--hairline)', borderRadius: 12, padding: '14px 16px', background: 'var(--surface-2)' }}>
                                <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Usuario</div>
                                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{result.email}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Contraseña temporal</div>
                                <div className="tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.04em' }}>{result.temp}</div>
                            </div>
                        </div>
                        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)' }}>
                            <button onClick={onSaved} className="btn-primary" style={{ width: '100%', height: 42, justifyContent: 'center', fontSize: 14 }}>Listo</button>
                        </div>
                    </>
                ) : (
                <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Nombre"><input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} style={inp} /></Field>
                    <Field label="Apellido"><input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} style={inp} /></Field>
                    <Field label="Email"><input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" style={inp} /></Field>
                    <Field label="Rol">
                        <select value={form.role} onChange={(e) => set('role', e.target.value)} style={inp}>
                            <option value="employee">Empleado</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Jornada (horas)"><input value={form.target_hours ?? ''} onChange={(e) => set('target_hours', e.target.value)} type="number" step="0.5" style={inp} /></Field>
                        <Field label="Entrada esperada"><input value={form.expected_check_in ?? ''} onChange={(e) => set('expected_check_in', e.target.value)} type="time" style={inp} /></Field>
                    </div>
                    {isNew && (
                        <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
                            Se crea el registro del empleado. El alta de credenciales y el envío de la invitación se completan con los servicios auth/mailer.
                        </p>
                    )}
                    {error && <div style={{ background: 'var(--danger-tint)', color: 'var(--danger)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>{error}</div>}
                </div>
                <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid var(--hairline-2)', background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 14, fontWeight: 600 }}>Cancelar</button>
                    <button onClick={save} disabled={busy} className="btn-primary" style={{ flex: 1.4, height: 42, justifyContent: 'center', fontSize: 14, opacity: busy ? 0.7 : 1 }}>{busy ? 'Guardando…' : (isNew ? 'Crear' : 'Guardar')}</button>
                </div>
                </>
                )}
            </div>
        </>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

const iconBtn: React.CSSProperties = { color: 'var(--ink-2)', padding: 6, borderRadius: 8, display: 'inline-flex' };
const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--hairline-2)', background: 'var(--surface)', padding: '0 12px', fontSize: 14.5, color: 'var(--ink)' };
