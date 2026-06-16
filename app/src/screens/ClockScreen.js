import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import {
    Clock, MapPin, ArrowRight, LogOut, Coffee, Play, Bell, CheckCircle2, Calendar, ChevronRight,
} from 'lucide-react-native';
import { C, R, shadow1, shadowPress } from '../theme';
import { Dot, Chip, Avatar } from '../components';
import { fmtTime, fmtDur, fmtDateLong, cap, pad } from '../helpers';

const STATUS_META = {
    fuera: { key: 'sinFichar', color: C.ink3, tone: 'neutral' },
    trabajando: { key: 'enJornada', color: C.ok, tone: 'ok' },
    pausa: { key: 'enPausa', color: C.warn, tone: 'warn' },
};

function resolveAction(estado, t) {
    if (estado === 'fuera') return { label: t('ficharEntrada'), kind: 'in', Icon: ArrowRight };
    if (estado === 'trabajando') return { label: t('ficharSalida'), kind: 'out', Icon: LogOut };
    return { label: t('volverPausa'), kind: 'break_end', Icon: Play };
}

function Header({ t, name, onMenu, onBell, notiCount }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <Pressable onPress={onMenu}><Avatar name={name} size={38} /></Pressable>
                <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink }}>{name.split(' ')[0]}</Text>
                    <Text style={{ fontSize: 12, color: C.ink3 }}>{name.split(' ').slice(1).join(' ')}</Text>
                </View>
            </View>
            <Pressable onPress={onBell} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={22} color={C.ink2} strokeWidth={1.7} />
                {notiCount > 0 && <View style={{ position: 'absolute', top: 7, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: C.danger, borderWidth: 2, borderColor: C.bg }} />}
            </Pressable>
        </View>
    );
}

function StatusLine({ estado, sinceLabel, t }) {
    const m = STATUS_META[estado];
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Dot color={m.color} size={9} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink }}>{t(m.key)}</Text>
            {sinceLabel ? <Text style={{ fontSize: 15, color: C.ink3, fontWeight: '500' }}>· {t('desde')} {sinceLabel}</Text> : null}
        </View>
    );
}

function BigButton({ action, onPress, disabled }) {
    const { Icon } = action;
    return (
        <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ([{
            height: 80, borderRadius: 18, backgroundColor: pressed ? C.accentPress : C.accent,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: disabled ? 0.6 : 1,
        }, shadowPress])}>
            <Icon size={26} color={C.onAccent} strokeWidth={1.9} />
            <Text style={{ fontSize: 21, fontWeight: '700', color: C.onAccent, letterSpacing: -0.2 }}>{action.label}</Text>
        </Pressable>
    );
}

function SecondaryBtn({ label, Icon, onPress, tone }) {
    const color = tone === 'warn' ? C.warn : C.ink2;
    return (
        <Pressable onPress={onPress} style={{ height: 52, borderRadius: R.md, borderWidth: 1.5, borderColor: C.hairline2, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <Icon size={20} color={color} strokeWidth={1.7} />
            <Text style={{ fontSize: 16, fontWeight: '600', color }}>{label}</Text>
        </Pressable>
    );
}

function Summary({ t, workedMin, targetMin, pausaMin }) {
    const pct = Math.min(100, (workedMin / targetMin) * 100);
    return (
        <View style={[{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: R.lg, padding: 16 }, shadow1]}>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: C.ink3, marginBottom: 8 }}>{t('trabajadoHoy')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 32, fontWeight: '700', letterSpacing: -0.6, color: C.ink }}>{fmtDur(workedMin)}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, color: C.ink3 }}>{t('objetivo')} {fmtDur(targetMin)}</Text>
                    {pausaMin > 0 ? <Text style={{ fontSize: 13, color: C.ink3 }}>{t('pausasLabel')} {fmtDur(pausaMin)}</Text> : null}
                </View>
            </View>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: C.surface3, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: C.accent, borderRadius: 4 }} />
            </View>
        </View>
    );
}

const PUNCH_META = {
    in: { key: 'entrada', color: C.ok, Icon: ArrowRight },
    out: { key: 'salida', color: C.ink2, Icon: LogOut },
    break_start: { key: 'salirPausa', color: C.warn, Icon: Coffee },
    break_end: { key: 'volverPausa', color: C.warn, Icon: Play },
};

function PunchList({ t, events }) {
    if (!events.length) {
        return <Text style={{ textAlign: 'center', color: C.ink3, fontSize: 14, paddingVertical: 18 }}>{t('sinMarcas')}</Text>;
    }
    return (
        <View>
            {events.map((e, i) => {
                const m = PUNCH_META[e.type];
                if (!m) return null;
                const { Icon } = m;
                return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: i < events.length - 1 ? 1 : 0, borderBottomColor: C.hairline }}>
                        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={16} color={m.color} strokeWidth={1.7} />
                        </View>
                        <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '500', color: C.ink }}>{t(m.key)}</Text>
                        <Text style={{ fontSize: 14.5, fontWeight: '600', color: C.ink2 }}>{fmtTime(e.t)}</Text>
                        <CheckCircle2 size={16} color={C.ok} strokeWidth={1.7} />
                    </View>
                );
            })}
        </View>
    );
}

export default function ClockScreen({
    t, lang, now, name, estado, sinceLabel, workedMin, targetMin, pausaMin, events,
    onPrimary, onPause, onClockOut, onHistory, onMenu, onBell, notiCount, busy,
}) {
    const action = resolveAction(estado, t);
    return (
        <View style={{ flex: 1 }}>
            <Header t={t} name={name} onMenu={onMenu} onBell={onBell} notiCount={notiCount} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 26, gap: 18 }}>
                <View style={{ alignItems: 'center', paddingTop: 10 }}>
                    <Text style={{ fontSize: 13, color: C.ink3, fontWeight: '500' }}>{cap(fmtDateLong(now, lang))}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                        <Text style={{ fontSize: 66, fontWeight: '600', letterSpacing: -2, color: C.ink }}>{fmtTime(now)}</Text>
                        <Text style={{ fontSize: 22, fontWeight: '500', color: C.ink3 }}>{pad(now.getSeconds())}</Text>
                    </View>
                </View>

                <View style={[{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: R.lg, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, shadow1]}>
                    <StatusLine estado={estado} sinceLabel={sinceLabel} t={t} />
                    <Chip tone="neutral" icon={<MapPin size={13} color={C.ink2} strokeWidth={1.7} />}>{t('sucursal')}</Chip>
                </View>

                <View style={{ gap: 12 }}>
                    <BigButton action={action} onPress={() => onPrimary(action.kind)} disabled={busy} />
                    {estado === 'trabajando' && (
                        <SecondaryBtn label={t('salirPausa')} Icon={Coffee} onPress={onPause} tone="warn" />
                    )}
                    {estado === 'pausa' && (
                        <SecondaryBtn label={t('ficharSalida')} Icon={LogOut} onPress={onClockOut} />
                    )}
                </View>

                <Summary t={t} workedMin={workedMin} targetMin={targetMin} pausaMin={pausaMin} />

                <View>
                    <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: C.ink3, marginBottom: 8, paddingLeft: 2 }}>{t('eventosHoy')}</Text>
                    <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: R.lg, paddingHorizontal: 16 }}>
                        <PunchList t={t} events={events} />
                    </View>
                </View>

                <Pressable onPress={onHistory} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 2 }}>
                    <Calendar size={17} color={C.ink2} strokeWidth={1.7} />
                    <Text style={{ color: C.ink2, fontSize: 14.5, fontWeight: '600' }}>{t('miHistorial')}</Text>
                    <ChevronRight size={15} color={C.ink2} strokeWidth={1.7} />
                </Pressable>
            </ScrollView>
        </View>
    );
}
