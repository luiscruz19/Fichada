'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from './icons';
import { ChipTone, Avatar } from './ui';
import type { Row } from '@/lib/types';
import { fmtTime } from '@/lib/format';
import { BASE_PATH } from '@/lib/config';
import { FichadaMap, type FichadaPoint } from './FichadaMap';

const ESTADO = {
    ok: { tone: 'ok' as const, label: 'Completa', icon: Ic.check },
    open: { tone: 'warn' as const, label: 'Jornada abierta', icon: Ic.alert },
};

export function HistorialClient({ rows, counts, exportBase }: { rows: Row[]; counts: { open: number; req: number }; exportBase: string }) {
    const [sel, setSel] = useState<Row | null>(null);

    return (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minHeight: '100vh' }}>
            {/* header */}
            <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Historial</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-3)' }}>Fichadas del equipo · hora oficial del servidor (UTC−3)</p>
                </div>
                <div style={{ display: 'flex', gap: 9 }}>
                    <a className="seg" href={`${exportBase}?format=csv`}>{Ic.doc({ size: 16 })}CSV</a>
                    <a className="seg" href={`${exportBase}?format=xlsx`}>{Ic.doc({ size: 16 })}Excel</a>
                    <a className="seg" href={`${exportBase}?format=pdf`}>{Ic.doc({ size: 16 })}PDF</a>
                </div>
            </div>

            {/* casos a revisar */}
            <div style={{ padding: '16px 28px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>Casos a revisar:</span>
                <ChipTone tone="warn" icon={Ic.alert({ size: 13 })}>{counts.open} jornadas abiertas</ChipTone>
                <ChipTone tone="accent" icon={Ic.bell({ size: 13 })}>{counts.req} solicitudes de corrección</ChipTone>
            </div>

            {/* tabla */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                            {['Empleado', 'Fecha', 'Entrada', 'Salida', 'Pausas', 'Total', 'Estado', ''].map((h, i) => (
                                <th key={i} className="th" style={{ paddingTop: 14, textAlign: i === 7 ? 'right' : 'left' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {rows.length === 0 && (
                                <tr><td className="td" colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '28px 0' }}>Todavía no hay fichadas registradas.</td></tr>
                            )}
                            {rows.map((r) => {
                                const es = ESTADO[r.estado];
                                const flag = r.estado !== 'ok' || !!r.req;
                                return (
                                    <tr key={r.shift.id} className={'row' + (flag ? ' flag' : '')} onClick={() => setSel(r)}>
                                        <td className="td"><div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}><Avatar ini={r.ini} size={28} />{r.emp}</div></td>
                                        <td className="td" style={{ color: 'var(--ink-2)' }}>{r.date}</td>
                                        <td className="td tnum" style={{ fontWeight: 600 }}>{r.in || '—'}</td>
                                        <td className="td tnum" style={{ fontWeight: 600, color: r.out ? 'var(--ink)' : 'var(--warn)' }}>{r.out || '—'}</td>
                                        <td className="td tnum" style={{ color: 'var(--ink-2)' }}>{r.pausas}</td>
                                        <td className="td tnum" style={{ fontWeight: 700 }}>{r.total}</td>
                                        <td className="td"><ChipTone tone={es.tone} icon={es.icon({ size: 12 })}>{es.label}</ChipTone></td>
                                        <td className="td" style={{ textAlign: 'right' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>
                                                {r.req && <ChipTone tone="accent" icon={Ic.bell({ size: 11 })}>solicitud</ChipTone>}
                                                {Ic.edit({ size: 16 })}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '12px 4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Ic.shield({ size: 13 })}Cada corrección queda registrada en la auditoría: quién, cuándo y el valor anterior. Hacé clic en una fila para ver el detalle.
                </p>
            </div>

            <Drawer row={sel} onClose={() => setSel(null)} />
        </main>
    );
}

function Field({ label, value, edited, locked }: { label: string; value: string; edited?: boolean; locked?: boolean }) {
    return (
        <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
            <div style={{ marginTop: 6, position: 'relative' }}>
                <input defaultValue={value} readOnly={locked} style={{ width: '100%', height: 46, borderRadius: 10, border: edited ? '1.5px solid var(--accent)' : '1.5px solid var(--hairline-2)', background: locked ? 'var(--surface-2)' : 'var(--surface)', padding: '0 12px', fontSize: 18, fontWeight: 600, color: locked ? 'var(--ink-2)' : 'var(--ink)' }} />
                {edited && !locked && <span style={{ position: 'absolute', right: 10, top: 14, fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>NUEVO</span>}
                {locked && <span style={{ position: 'absolute', right: 10, top: 15, color: 'var(--ink-3)' }}>{Ic.lock({ size: 15 })}</span>}
            </div>
        </div>
    );
}

function Drawer({ row, onClose }: { row: Row | null; onClose: () => void }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    if (!row) return null;
    const { shift, req } = row;

    async function resolve(action: 'approve' | 'reject') {
        if (!req) return;
        setBusy(true);
        try {
            await fetch(`${BASE_PATH}/api/correction/${req.id}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            onClose();
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    const requestedOut = req?.requested_check_out ? fmtTime(req.requested_check_out) : null;

    const locPoints: FichadaPoint[] = [];
    if (shift.check_in_lat != null && shift.check_in_lng != null) {
        locPoints.push({ lat: Number(shift.check_in_lat), lng: Number(shift.check_in_lng), kind: 'in', label: `Entrada ${row.in || ''}`.trim() });
    }
    if (shift.check_out_lat != null && shift.check_out_lng != null) {
        locPoints.push({ lat: Number(shift.check_out_lat), lng: Number(shift.check_out_lng), kind: 'out', label: `Salida ${row.out || ''}`.trim() });
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.02 260 / 0.28)', zIndex: 20, animation: 'fch-fade 0.18s' }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 392, background: 'var(--surface)', zIndex: 21, boxShadow: '-12px 0 40px oklch(0.2 0.02 260 / 0.16)', display: 'flex', flexDirection: 'column', animation: 'fch-drawer 0.26s cubic-bezier(0.2,0.9,0.2,1)' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{req ? 'Revisar solicitud' : 'Detalle de fichada'}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 7 }}><Avatar ini={row.ini} size={20} />{row.emp} · {row.date}</div>
                    </div>
                    <button onClick={onClose} style={{ color: 'var(--ink-3)', padding: 4 }}>{Ic.x({ size: 22 })}</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
                    {req ? (
                        <div style={{ background: 'var(--accent-tint)', border: '1px solid color-mix(in oklab, var(--accent) 30%, transparent)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 650, color: 'var(--accent)' }}>{Ic.bell({ size: 16 })}Solicitud del empleado</div>
                            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 5, lineHeight: 1.45 }}>“{req.reason}”{requestedOut ? ` — pide salida ${requestedOut}.` : ''}</div>
                        </div>
                    ) : (
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 12, padding: '11px 13px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--ink-3)', marginTop: 1 }}>{Ic.lock({ size: 16 })}</span>
                            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>Solo lectura. El administrador edita la salida únicamente cuando el empleado envía una solicitud de corrección.</div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Entrada" value={row.in || '—'} locked />
                        <Field label="Salida" value={row.out || requestedOut || '—'} edited={!!req && !row.out} locked={!req} />
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ubicación de la marca</label>
                        <FichadaMap points={locPoints} />
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Origen</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                            {shift.origin === 'mobile' ? 'Fichaje desde la app del empleado.' : 'Generada por una corrección manual.'}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 10 }}>
                    {req ? (
                        <>
                            <button disabled={busy} onClick={() => resolve('reject')} style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid var(--hairline-2)', background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 14, fontWeight: 600 }}>Rechazar</button>
                            <button disabled={busy} onClick={() => resolve('approve')} style={{ flex: 1.4, height: 42, borderRadius: 10, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: busy ? 0.7 : 1 }}>{Ic.check({ size: 18, style: { color: 'var(--on-accent)' } })}{busy ? 'Guardando…' : 'Aprobar y guardar'}</button>
                        </>
                    ) : (
                        <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid var(--hairline-2)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>Cerrar</button>
                    )}
                </div>
            </div>
        </>
    );
}
