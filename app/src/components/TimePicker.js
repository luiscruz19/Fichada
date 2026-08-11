import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus, Check } from 'lucide-react-native';
import { C, R } from '../theme';
import { fmtMinutos } from '../helpers';

// Selector de hora hecho en JS a propósito: @react-native-community/datetimepicker es
// módulo nativo y la app se distribuye por OTA con APK internos, sin Play Store; meterlo
// obligaría a que cada empleado reinstale a mano.
// El estado es un número (minutos desde medianoche): no hay string que parsear, no hay
// formato que explicarle a nadie y no existe el "25:99" que antes desbordaba la fecha.

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
    // Módulo 1440 en las dos direcciones: la hora nunca se sale del día. El salto de día
    // se decide con el toggle explícito, no como efecto colateral de un desbordamiento.
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
                // Turno nocturno: entró 22:00 y salió 06:00. Sin esto la salida queda ANTES
                // de la entrada y la jornada se guardaría en 0 horas trabajadas.
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
