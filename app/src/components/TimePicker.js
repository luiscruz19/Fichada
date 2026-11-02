import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus, Check } from 'lucide-react-native';
import { C, R } from '../theme';
import { fmtMinutos } from '../helpers';

// En JS a propósito: un selector nativo obligaría a reinstalar el APK, y la app se actualiza por OTA.

function Redondo({ children, onPress }) {
    return (
        <Pressable onPress={onPress} hitSlop={8}
            style={({ pressed }) => ({
                width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: C.hairline2, backgroundColor: pressed ? C.surface3 : C.surface,
            })}>{children}</Pressable>
    );
}

function Fila({ etiqueta, onMenos, onMas }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: C.ink2, fontWeight: '600' }}>{etiqueta}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <Redondo onPress={onMenos}><Minus size={20} color={C.ink} strokeWidth={2} /></Redondo>
                <Redondo onPress={onMas}><Plus size={20} color={C.ink} strokeWidth={2} /></Redondo>
            </View>
        </View>
    );
}

export default function SelectorHora({ minutos, onChange, sugeridos = [], diaSiguiente, onDiaSiguiente }) {
    // La hora nunca sale del día: el salto al día siguiente lo decide el toggle.
    const mover = (delta) => onChange((minutos + delta + 1440) % 1440);

    return (
        <View>
            <View style={{ alignItems: 'center', paddingVertical: 10, borderRadius: R.md, backgroundColor: C.surface2 }}>
                <Text style={{ fontSize: 42, fontWeight: '700', color: C.ink, letterSpacing: -1 }}>{fmtMinutos(minutos)}</Text>
            </View>

            {sugeridos.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {sugeridos.map((m) => {
                        const on = m === minutos;
                        return (
                            <Pressable key={m} onPress={() => onChange(m)}
                                style={{
                                    paddingHorizontal: 14, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 1.5, borderColor: on ? C.accent : C.hairline2,
                                    backgroundColor: on ? C.accentTint : C.surface,
                                }}>
                                <Text style={{ fontSize: 14.5, fontWeight: '600', color: on ? C.accent : C.ink2 }}>{fmtMinutos(m)}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}

            <Fila etiqueta="Hora" onMenos={() => mover(-60)} onMas={() => mover(60)} />
            <Fila etiqueta="Minutos (de a 15)" onMenos={() => mover(-15)} onMas={() => mover(15)} />

            {onDiaSiguiente ? (
                // Turno nocturno: sin esto la salida queda antes de la entrada y la jornada en 0 horas.
                <Pressable onPress={() => onDiaSiguiente(!diaSiguiente)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
                    <View style={{
                        width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: diaSiguiente ? C.accent : C.hairline2,
                        backgroundColor: diaSiguiente ? C.accent : 'transparent',
                    }}>
                        {diaSiguiente ? <Check size={16} color={C.onAccent} strokeWidth={2.5} /> : null}
                    </View>
                    <Text style={{ fontSize: 14, color: C.ink2 }}>Salí al día siguiente</Text>
                </Pressable>
            ) : null}
        </View>
    );
}
