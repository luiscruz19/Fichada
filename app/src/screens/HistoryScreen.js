import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, AlertCircle, Pencil } from 'lucide-react-native';
import { C, R, shadow1 } from '../theme';
import { Chip } from '../components';
import SelectorHora from '../components/TimePicker';
import { fmtTimeFromISO, fmtDur, fmtDateLong, cap, partesAr, isoDesdeMinutosAr } from '../helpers';
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

// Horas sugeridas de salida: las típicas de cierre de jornada, para resolverlo de un toque.
const SUGERIDOS = [13 * 60, 17 * 60, 18 * 60, 19 * 60, 20 * 60];

function CorrectionModal({ t, shift, onClose, onSent }) {
    const insets = useSafeAreaInsets();
    const [reason, setReason] = useState('');
    const [minutos, setMinutos] = useState(18 * 60);
    const [diaSiguiente, setDiaSiguiente] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // Arranca en una hora razonable para ESTA jornada y limpia el estado al cambiar de
    // jornada: antes el modal se montaba una vez y arrastraba lo tipeado de la anterior.
    useEffect(() => {
        if (!shift) return;
        const entrada = partesAr(shift.check_in).min;
        // Propuesta: 8h después de la entrada, redondeado a 15 min y acotado al día.
        const propuesta = Math.min(23 * 60 + 45, Math.round((entrada + 8 * 60) / 15) * 15);
        setMinutos(propuesta % 1440);
        setDiaSiguiente(false);
        setReason('');
        setError(null);
    }, [shift?.id]);

    async function send() {
        if (!shift) return;
        setBusy(true); setError(null);
        const iso = isoDesdeMinutosAr(shift.check_in, minutos, diaSiguiente);
        // El motivo es opcional: si no escribió nada, no mandamos la clave.
        const payload = { type: 'edit', shift_id: shift.id, requested_check_out: iso };
        if (reason.trim()) payload.reason = reason.trim();
        try {
            await createCorrectionRequest(payload);
            onSent();
        } catch (e) {
            setError(e.message || 'No se pudo enviar');
        } finally {
            setBusy(false);
        }
    }

    const entradaTxt = shift ? fmtTimeFromISO(shift.check_in) : '';

    return (
        <Modal visible={!!shift} transparent animationType="slide" onRequestClose={onClose}>
            {/* En iOS hay que descontar el teclado a mano; en Android el Dialog del Modal ya
                hace resize por su cuenta y sumarle padding lo descontaría dos veces. */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(24,27,30,0.34)', justifyContent: 'flex-end' }}>
                    {/* maxHeight + scroll: sin esto el contenido se desborda con el teclado
                        abierto y el botón de enviar queda fuera de la pantalla. */}
                    <Pressable onPress={(e) => e.stopPropagation?.()}
                        style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, maxHeight: '92%' }}>
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.hairline2, alignSelf: 'center', marginBottom: 12 }} />
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: Math.max(28, insets.bottom + 12) }}
                        >
                            <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 4 }}>{t('pedirCorreccion')}</Text>
                            <Text style={{ fontSize: 13.5, color: C.ink3, marginBottom: 16 }}>
                                {entradaTxt ? `Entrada ${entradaTxt}. ` : ''}Elegí la hora de salida correcta. El administrador la revisa y la aprueba.
                            </Text>

                            <SelectorHora
                                minutos={minutos}
                                onChange={setMinutos}
                                sugeridos={SUGERIDOS}
                                diaSiguiente={diaSiguiente}
                                onDiaSiguiente={setDiaSiguiente}
                            />

                            <Text style={{ fontSize: 12, color: C.ink3, fontWeight: '600', marginTop: 20, marginBottom: 6 }}>Motivo (opcional)</Text>
                            <TextInput value={reason} onChangeText={setReason} placeholder="Me olvidé de fichar la salida…" placeholderTextColor={C.ink3} multiline
                                style={{ minHeight: 70, borderRadius: R.md, borderWidth: 1.5, borderColor: C.hairline2, padding: 12, fontSize: 15, color: C.ink, textAlignVertical: 'top' }} />

                            {error ? <Text style={{ color: C.danger, fontSize: 13, fontWeight: '600', marginTop: 10 }}>{error}</Text> : null}

                            <Pressable onPress={send} disabled={busy} style={{ height: 52, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 18, opacity: busy ? 0.7 : 1 }}>
                                <Text style={{ color: C.onAccent, fontSize: 16, fontWeight: '700' }}>{busy ? 'Enviando…' : 'Enviar solicitud'}</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}
