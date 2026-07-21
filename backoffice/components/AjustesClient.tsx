'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from './icons';
import { px } from '@/lib/client';
import type { Setting, Site } from '@/lib/types';

export function AjustesClient({ settings, sites }: { settings: Setting | null; sites: Site[] }) {
    const router = useRouter();
    const [s, setS] = useState<Partial<Setting>>(settings || {});
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);
    const set = (k: keyof Setting, v: any) => { setS((o) => ({ ...o, [k]: v })); setSaved(false); };

    async function save() {
        setBusy(true);
        const body = {
            default_target_hours: s.default_target_hours ? Number(s.default_target_hours) : null,
            default_expected_check_in: s.default_expected_check_in || null,
            late_tolerance_minutes: Number(s.late_tolerance_minutes ?? 0),
            rounding_minutes: Number(s.rounding_minutes ?? 0),
            timezone: s.timezone || 'America/Argentina/Buenos_Aires',
            location_required: !!s.location_required,
            allow_breaks: !!s.allow_breaks,
            allow_correction_requests: !!s.allow_correction_requests,
            work_days: Array.isArray(s.work_days) ? s.work_days : null,
            reminders_enabled: s.reminders_enabled !== false,
            reminder_checkin_start: Number(s.reminder_checkin_start ?? 9),
            reminder_checkin_end: Number(s.reminder_checkin_end ?? 13),
            reminder_checkout_start: Number(s.reminder_checkout_start ?? 18),
            reminder_checkout_end: Number(s.reminder_checkout_end ?? 20),
        };
        const r = await px('/settings/admin', { method: 'PUT', body: JSON.stringify(body) });
        setBusy(false);
        if (r.ok) { setSaved(true); router.refresh(); }
    }

    return (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 28px 0' }}>
                <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Ajustes</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-3)' }}>Configuración global del sistema</p>
            </div>

            <div style={{ padding: '18px 28px 28px', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Card title="Jornada y reglas">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Jornada por defecto (horas)"><input type="number" step="0.5" value={s.default_target_hours ?? ''} onChange={(e) => set('default_target_hours', e.target.value)} style={inp} /></Field>
                        <Field label="Entrada esperada"><input type="time" value={s.default_expected_check_in ?? ''} onChange={(e) => set('default_expected_check_in', e.target.value)} style={inp} /></Field>
                        <Field label="Tolerancia tardanza (min)"><input type="number" value={s.late_tolerance_minutes ?? 0} onChange={(e) => set('late_tolerance_minutes', e.target.value)} style={inp} /></Field>
                        <Field label="Redondeo de fichadas (min)"><input type="number" value={s.rounding_minutes ?? 0} onChange={(e) => set('rounding_minutes', e.target.value)} style={inp} /></Field>
                        <Field label="Zona horaria"><input value={s.timezone ?? 'America/Argentina/Buenos_Aires'} onChange={(e) => set('timezone', e.target.value)} style={inp} /></Field>
                    </div>
                </Card>

                <Card title="Fichaje">
                    <Toggle label="Ubicación obligatoria para fichar" value={!!s.location_required} onChange={(v) => set('location_required', v)} />
                    <Toggle label="Permitir pausas (salir / volver)" value={!!s.allow_breaks} onChange={(v) => set('allow_breaks', v)} />
                    <Toggle label="Permitir solicitudes de corrección" value={!!s.allow_correction_requests} onChange={(v) => set('allow_correction_requests', v)} />
                </Card>

                <Card title="Recordatorios push">
                    <Toggle label="Enviar recordatorios de fichada" value={s.reminders_enabled !== false} onChange={(v) => set('reminders_enabled', v)} />
                    <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, margin: '10px 0 14px' }}>
                        Si un empleado no fichó la entrada, se le recuerda cada 30 min dentro de la franja de entrada.
                        Si dejó la jornada abierta, se le recuerda la salida dentro de la franja de salida. Solo en días laborales.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, opacity: s.reminders_enabled !== false ? 1 : 0.5 }}>
                        <Field label="Entrada · desde (hora)"><input type="number" min={0} max={23} value={s.reminder_checkin_start ?? 9} onChange={(e) => set('reminder_checkin_start', e.target.value)} style={inp} /></Field>
                        <Field label="Entrada · hasta (hora)"><input type="number" min={0} max={24} value={s.reminder_checkin_end ?? 13} onChange={(e) => set('reminder_checkin_end', e.target.value)} style={inp} /></Field>
                        <Field label="Salida · desde (hora)"><input type="number" min={0} max={23} value={s.reminder_checkout_start ?? 18} onChange={(e) => set('reminder_checkout_start', e.target.value)} style={inp} /></Field>
                        <Field label="Salida · hasta (hora)"><input type="number" min={0} max={24} value={s.reminder_checkout_end ?? 20} onChange={(e) => set('reminder_checkout_end', e.target.value)} style={inp} /></Field>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>Días laborales</label>
                        <WorkDays value={Array.isArray(s.work_days) ? s.work_days : ['mon', 'tue', 'wed', 'thu', 'fri']} onChange={(v) => set('work_days', v)} />
                    </div>
                </Card>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={save} disabled={busy} className="btn-primary" style={{ height: 42, opacity: busy ? 0.7 : 1 }}>{busy ? 'Guardando…' : 'Guardar ajustes'}</button>
                    {saved && <span style={{ color: 'var(--ok)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>{Ic.check({ size: 16 })}Guardado</span>}
                </div>

                <SitesCard sites={sites} onChange={() => router.refresh()} />
            </div>
        </main>
    );
}

function SitesCard({ sites, onChange }: { sites: Site[]; onChange: () => void }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [busy, setBusy] = useState(false);

    async function add() {
        if (!name.trim()) return;
        setBusy(true);
        await px('/sites/admin', { method: 'POST', body: JSON.stringify({ name, address: address || null }) });
        setBusy(false); setName(''); setAddress(''); onChange();
    }
    async function del(id: number) {
        setBusy(true);
        await px(`/sites/admin/${id}`, { method: 'DELETE' });
        setBusy(false); onChange();
    }

    return (
        <Card title="Sedes (referencia para el mapa)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {sites.length === 0 && <div style={{ color: 'var(--ink-3)', fontSize: 13.5 }}>No hay sedes cargadas.</div>}
                {sites.map((site) => (
                    <div key={site.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--hairline)', borderRadius: 10 }}>
                        {Ic.pin({ size: 16, style: { color: 'var(--ink-3)' } })}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{site.name}</div>
                            {site.address && <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{site.address}</div>}
                        </div>
                        <button onClick={() => del(site.id)} disabled={busy} title="Eliminar" style={{ color: 'var(--danger)', padding: 6 }}>{Ic.trash({ size: 16 })}</button>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Nombre de la sede" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inp, flex: 1 }} />
                <input placeholder="Dirección (opcional)" value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inp, flex: 1 }} />
                <button onClick={add} disabled={busy} className="btn-primary" style={{ height: 44 }}>{Ic.plus({ size: 16 })}Agregar</button>
            </div>
        </Card>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>{title}</div>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
            <span style={{ fontSize: 14.5, color: 'var(--ink)' }}>{label}</span>
            <button onClick={() => onChange(!value)} style={{ width: 44, height: 26, borderRadius: 999, background: value ? 'var(--accent)' : 'var(--surface-3)', position: 'relative', transition: 'background 0.15s' }}>
                <span style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-1)', transition: 'left 0.15s' }} />
            </button>
        </div>
    );
}

const DAYS: { key: string; label: string }[] = [
    { key: 'mon', label: 'Lun' }, { key: 'tue', label: 'Mar' }, { key: 'wed', label: 'Mié' },
    { key: 'thu', label: 'Jue' }, { key: 'fri', label: 'Vie' }, { key: 'sat', label: 'Sáb' }, { key: 'sun', label: 'Dom' },
];

function WorkDays({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    const toggle = (k: string) => onChange(value.includes(k) ? value.filter((d) => d !== k) : [...value, k]);
    return (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {DAYS.map((d) => {
                const on = value.includes(d.key);
                return (
                    <button key={d.key} type="button" onClick={() => toggle(d.key)}
                        style={{
                            minWidth: 46, height: 38, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            border: `1.5px solid ${on ? 'var(--accent)' : 'var(--hairline-2)'}`,
                            background: on ? 'var(--accent)' : 'var(--surface)',
                            color: on ? 'var(--on-accent)' : 'var(--ink-3)',
                        }}>{d.label}</button>
                );
            })}
        </div>
    );
}

const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--hairline-2)', background: 'var(--surface)', padding: '0 12px', fontSize: 14.5, color: 'var(--ink)' };
