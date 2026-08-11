import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { RefreshCw, LogOut, Smartphone, ChevronRight } from 'lucide-react-native';
import { C } from '../theme';
import { Avatar } from '../components';
import { buscarActualizacion, versionDetalle } from '../updates';

/**
 * Menú del empleado (equivalente a la pestaña Perfil de otras apps del equipo): quién sos,
 * qué versión corre y el botón para traer la última sin reinstalar. Antes esto era un
 * Alert escondido detrás de un tap en el avatar: nadie lo encontraba.
 */
export default function MenuSheet({ t, visible, name, estado, onClose, onLogout }) {
    const [buscando, setBuscando] = useState(false);
    const [version, setVersion] = useState(() => versionDetalle());

    async function onBuscar() {
        if (buscando) return;
        setBuscando(true);
        try {
            await buscarActualizacion({ hayJornadaAbierta: estado !== 'fuera' });
            setVersion(versionDetalle());
        } finally {
            setBuscando(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(24,27,30,0.34)', justifyContent: 'flex-end' }}>
                <Pressable onPress={(e) => e.stopPropagation?.()} style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 30 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.hairline2, alignSelf: 'center', marginBottom: 14 }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 16 }}>
                        <Avatar name={name} size={46} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 17, fontWeight: '700', color: C.ink }}>{name}</Text>
                            <Text style={{ fontSize: 12.5, color: C.ink3, marginTop: 1 }}>{t('dispositivoVinculado')}</Text>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: C.hairline, marginHorizontal: 22 }} />

                    <Row
                        Icon={RefreshCw}
                        title={t('buscarActualizacion')}
                        sub={buscando ? t('buscando') : version}
                        onPress={onBuscar}
                        loading={buscando}
                    />

                    <Row
                        Icon={LogOut}
                        title={t('cerrarSesion')}
                        sub={t('cerrarSesionSub')}
                        color={C.danger}
                        onPress={onLogout}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function Row({ Icon, title, sub, onPress, color, loading }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 13,
                paddingHorizontal: 22, paddingVertical: 15,
                backgroundColor: pressed ? C.surface2 : 'transparent',
            })}
        >
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
                {loading ? <ActivityIndicator size="small" color={C.accent} /> : <Icon size={18} color={color || C.ink2} strokeWidth={1.8} />}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '600', color: color || C.ink }}>{title}</Text>
                {sub ? <Text style={{ fontSize: 12.5, color: C.ink3, marginTop: 2 }}>{sub}</Text> : null}
            </View>
            <ChevronRight size={18} color={C.ink3} strokeWidth={1.8} />
        </Pressable>
    );
}
