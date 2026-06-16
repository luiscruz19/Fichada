import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertCircle, LogOut } from 'lucide-react-native';
import { C, R, shadowPress } from '../theme';
import { fmtTimeFromISO, fmtDateLong, cap } from '../helpers';

// Se muestra cuando hay una jornada abierta de un día ANTERIOR: bloquea el fichaje
// normal hasta cerrarla (regla de negocio: no se puede reabrir sin cerrar la previa).
export default function BlockedShiftScreen({ t, lang, shift, onClose, busy }) {
    const ci = shift?.check_in ? new Date(shift.check_in) : null;
    return (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.warnTint, alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={38} color={C.warn} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: C.ink, textAlign: 'center' }}>{t('jornadaAbierta')}</Text>
            {ci ? (
                <Text style={{ fontSize: 15, color: C.ink2, textAlign: 'center', lineHeight: 22 }}>
                    Quedó una jornada sin cerrar del {cap(fmtDateLong(ci, lang))}.
                </Text>
            ) : null}
            <Text style={{ fontSize: 14, color: C.ink3, textAlign: 'center', lineHeight: 20 }}>{t('paraVolverFichar')}</Text>

            <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: R.lg, padding: 16, width: '100%', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: C.ink3, fontWeight: '600' }}>{t('entrada')}</Text>
                <Text style={{ fontSize: 26, fontWeight: '700', color: C.ink }}>{fmtTimeFromISO(shift?.check_in) || '—'}</Text>
            </View>

            <Pressable onPress={onClose} disabled={busy} style={[{ height: 64, borderRadius: 18, backgroundColor: C.accent, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6, opacity: busy ? 0.7 : 1 }, shadowPress]}>
                <LogOut size={24} color={C.onAccent} strokeWidth={1.9} />
                <Text style={{ color: C.onAccent, fontSize: 19, fontWeight: '700' }}>{t('cerrarJornada')}</Text>
            </Pressable>
        </View>
    );
}
