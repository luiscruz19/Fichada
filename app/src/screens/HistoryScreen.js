import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { ArrowLeft, CheckCircle2, AlertCircle, Pencil } from 'lucide-react-native';
import { C, R, shadow1 } from '../theme';
import { Chip } from '../components';
import { fmtTimeFromISO, fmtDur, fmtDateLong, cap } from '../helpers';
import { getHistory, createCorrectionRequest } from '../api';

function dayLabel(iso, lang) {
    return cap(fmtDateLong(new Date(iso), lang));
}

export default function HistoryScreen({ t, lang, onBack }) {
    const [items, setItems] = useState(null);
    const [correcting, setCorrecting] = useState(null); // shift a corregir

    const load = useCallback(async () => {
        try {
            const res = await getHistory();
            setItems(res?.data || []);
        } catch {
            setItems([]);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
                <Pressable onPress={onBack} style={{ padding: 6 }}><ArrowLeft size={24} color={C.ink} strokeWidth={1.8} /></Pressable>
                <Text style={{ fontSize: 19, fontWeight: '700', color: C.ink }}>{t('miHistorial')}</Text>
                <View style={{ flex: 1 }} />
                <Chip tone="neutral">{t('soloLectura')}</Chip>
            </View>

            {items === null ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.accent} /></View>
            ) : items.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
                    <Text style={{ color: C.ink3, fontSize: 15, textAlign: 'center' }}>{t('sinMarcas')}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                    {items.map((s) => {
                        const open = s.status === 'open';
                        const worked = s.worked_seconds != null ? fmtDur(s.worked_seconds / 60) : '—';
                        return (
                            <View key={s.id} style={[{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: R.lg, padding: 14 }, shadow1]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text style={{ fontSize: 14.5, fontWeight: '600', color: C.ink }}>{dayLabel(s.check_in, lang)}</Text>
                                    {open
                                        ? <Chip tone="warn" icon={<AlertCircle size={13} color={C.warn} strokeWidth={1.8} />}>{t('sinSalida')}</Chip>
                                        : <Chip tone="ok" icon={<CheckCircle2 size={13} color={C.ok} strokeWidth={1.8} />}>{t('completa')}</Chip>}
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Stat label={t('entrada')} value={fmtTimeFromISO(s.check_in) || '—'} />
                                    <Stat label={t('salida')} value={fmtTimeFromISO(s.check_out) || '—'} />
                                    <Stat label={t('total')} value={worked} accent />
                                </View>
                                <Pressable onPress={() => setCorrecting(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' }}>
                                    <Pencil size={15} color={C.accent} strokeWidth={1.8} />
                                    <Text style={{ color: C.accent, fontSize: 13.5, fontWeight: '600' }}>{t('pedirCorreccion')}</Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            <CorrectionModal t={t} shift={correcting} onClose={() => setCorrecting(null)} onSent={() => { setCorrecting(null); load(); }} />
        </View>
    );
}

function Stat({ label, value, accent }) {
    return (
        <View>
            <Text style={{ fontSize: 11.5, color: C.ink3, fontWeight: '600' }}>{label}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: accent ? C.accent : C.ink }}>{value}</Text>
        </View>
    );
}

function CorrectionModal({ t, shift, onClose, onSent }) {
    const [reason, setReason] = useState('');
    const [hhmm, setHhmm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    async function send() {
        if (!reason.trim()) { setError('Escribí el motivo'); return; }
        const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
        if (!m) { setError('Indicá la hora de salida correcta (HH:MM)'); return; }
        setBusy(true); setError(null);
        const d = new Date(shift.check_in);
        d.setHours(Number(m[1]), Number(m[2]), 0, 0);
        const payload = { type: 'edit', shift_id: shift.id, reason, requested_check_out: d.toISOString() };
        try {
            await createCorrectionRequest(payload);
            setReason(''); setHhmm('');
            onSent();
        } catch (e) {
            setError(e.message || 'No se pudo enviar');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal visible={!!shift} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(24,27,30,0.34)', justifyContent: 'flex-end' }}>
                <Pressable onPress={(e) => e.stopPropagation?.()} style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 30 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.hairline2, alignSelf: 'center', marginBottom: 14 }} />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 4 }}>{t('pedirCorreccion')}</Text>
                    <Text style={{ fontSize: 13.5, color: C.ink3, marginBottom: 16 }}>El administrador revisa y aprueba el cambio.</Text>

                    <Text style={{ fontSize: 12, color: C.ink3, fontWeight: '600', marginBottom: 6 }}>Hora de salida correcta (HH:MM, opcional)</Text>
                    <TextInput value={hhmm} onChangeText={setHhmm} placeholder="18:00" placeholderTextColor={C.ink3} keyboardType="numbers-and-punctuation"
                        style={{ height: 48, borderRadius: R.md, borderWidth: 1.5, borderColor: C.hairline2, paddingHorizontal: 12, fontSize: 16, color: C.ink, marginBottom: 14 }} />

                    <Text style={{ fontSize: 12, color: C.ink3, fontWeight: '600', marginBottom: 6 }}>Motivo</Text>
                    <TextInput value={reason} onChangeText={setReason} placeholder="Me olvidé de fichar la salida…" placeholderTextColor={C.ink3} multiline
                        style={{ minHeight: 70, borderRadius: R.md, borderWidth: 1.5, borderColor: C.hairline2, padding: 12, fontSize: 15, color: C.ink, textAlignVertical: 'top' }} />

                    {error ? <Text style={{ color: C.danger, fontSize: 13, fontWeight: '600', marginTop: 10 }}>{error}</Text> : null}

                    <Pressable onPress={send} disabled={busy} style={{ height: 52, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 18, opacity: busy ? 0.7 : 1 }}>
                        <Text style={{ color: C.onAccent, fontSize: 16, fontWeight: '700' }}>{busy ? 'Enviando…' : 'Enviar solicitud'}</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
