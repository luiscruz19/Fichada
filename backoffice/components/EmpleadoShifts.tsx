'use client';

import { useState } from 'react';
import { Ic } from './icons';
import { ChipTone } from './ui';
import { FichadaMap, type FichadaPoint } from './FichadaMap';
import { fmtTime, fmtDateShort, secondsToHHMM } from '@/lib/format';
import type { Shift } from '@/lib/types';

// Tabla de jornadas de un empleado; al hacer clic en una fila abre un drawer con el
// detalle y el mapa de esa fichada (mismo patrón que el Historial).
export function EmpleadoShifts({ shifts, name }: { shifts: Shift[]; name: string }) {
    const [sel, setSel] = useState<Shift | null>(null);

    return (
        <>
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
                                <tr><td className="td" colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '28px 0' }}>No hay fichadas en el período seleccionado.</td></tr>
                            )}
                            {shifts.map((s) => {
                                const pausas = (s.breaks || []).reduce((a, b) => a + (b.duration_seconds || 0), 0);
                                const hasIn = s.check_in_lat != null && s.check_in_lng != null;
                                const hasOut = s.check_out_lat != null && s.check_out_lng != null;
                                return (
                                    <tr key={s.id} className="row" style={{ cursor: 'pointer' }} onClick={() => setSel(s)}>
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

            {sel && <ShiftDrawer shift={sel} name={name} onClose={() => setSel(null)} />}
        </>
    );
}

function ShiftDrawer({ shift, name, onClose }: { shift: Shift; name: string; onClose: () => void }) {
    const pausas = (shift.breaks || []).reduce((a, b) => a + (b.duration_seconds || 0), 0);
    const points: FichadaPoint[] = [];
    if (shift.check_in_lat != null && shift.check_in_lng != null) points.push({ lat: Number(shift.check_in_lat), lng: Number(shift.check_in_lng), kind: 'in', label: `Entrada ${fmtTime(shift.check_in) || ''}`.trim() });
    if (shift.check_out_lat != null && shift.check_out_lng != null) points.push({ lat: Number(shift.check_out_lat), lng: Number(shift.check_out_lng), kind: 'out', label: `Salida ${fmtTime(shift.check_out) || ''}`.trim() });

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.02 260 / 0.28)', zIndex: 20, animation: 'fch-fade 0.18s' }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 392, maxWidth: '92vw', background: 'var(--surface)', zIndex: 21, boxShadow: '-12px 0 40px oklch(0.2 0.02 260 / 0.16)', display: 'flex', flexDirection: 'column', animation: 'fch-drawer 0.26s cubic-bezier(0.2,0.9,0.2,1)' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>Detalle de fichada</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{name} · {fmtDateShort(shift.check_in)}</div>
                    </div>
                    <button onClick={onClose} style={{ color: 'var(--ink-3)', padding: 4 }}>{Ic.x({ size: 22 })}</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                        <Metric label="Entrada" value={fmtTime(shift.check_in) || '—'} />
                        <Metric label="Salida" value={fmtTime(shift.check_out) || '—'} warn={!shift.check_out} />
                        <Metric label="Pausas" value={pausas ? secondsToHHMM(pausas) : '—'} />
                        <Metric label="Total trabajado" value={secondsToHHMM(shift.worked_seconds)} />
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ubicación de la marca</label>
                        <FichadaMap points={points} height={220} />
                    </div>
                </div>

                <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)' }}>
                    <button onClick={onClose} style={{ width: '100%', height: 42, borderRadius: 10, border: '1.5px solid var(--hairline-2)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>Cerrar</button>
                </div>
            </div>
        </>
    );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
    return (
        <div style={{ border: '1px solid var(--hairline)', borderRadius: 10, padding: '10px 12px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 700, marginTop: 2, color: warn ? 'var(--warn)' : 'var(--ink)' }}>{value}</div>
        </div>
    );
}
