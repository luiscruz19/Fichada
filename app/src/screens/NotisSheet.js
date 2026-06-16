import React from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Bell, AlertCircle, Clock } from 'lucide-react-native';
import { C, R } from '../theme';
import { fmtTimeFromISO } from '../helpers';

const META = {
    open_shift_alert: { Icon: AlertCircle, color: C.warn },
    check_in_reminder: { Icon: Clock, color: C.accent },
};

export default function NotisSheet({ t, visible, items, onClose, onRead }) {
    const list = items || [];
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(24,27,30,0.34)', justifyContent: 'flex-end' }}>
                <Pressable onPress={(e) => e.stopPropagation?.()} style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 28, maxHeight: '80%' }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.hairline2, alignSelf: 'center', marginBottom: 8 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{t('notificaciones')}</Text>
                        {list.some((n) => !n.read_at) ? (
                            <Pressable onPress={onRead}><Text style={{ color: C.accent, fontSize: 13.5, fontWeight: '600' }}>{t('marcarLeidas')}</Text></Pressable>
                        ) : null}
                    </View>

                    {list.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                            <Bell size={30} color={C.ink3} strokeWidth={1.6} />
                            <Text style={{ color: C.ink3, fontSize: 14.5, marginTop: 10 }}>{t('sinNotis')}</Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                            {list.map((n) => {
                                const m = META[n.type] || { Icon: Bell, color: C.ink3 };
                                const Icon = m.Icon;
                                return (
                                    <View key={n.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairline, opacity: n.read_at ? 0.55 : 1 }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={18} color={m.color} strokeWidth={1.8} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14.5, fontWeight: '600', color: C.ink }}>{n.title || t(n.type === 'open_shift_alert' ? 'openShiftTitle' : 'reminderTitle')}</Text>
                                            {n.body ? <Text style={{ fontSize: 13.5, color: C.ink3, marginTop: 2 }}>{n.body}</Text> : null}
                                        </View>
                                        <Text style={{ fontSize: 12, color: C.ink3 }}>{fmtTimeFromISO(n.createdAt) || ''}</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}
