import React from 'react';
import { View, Text } from 'react-native';
import { C } from './theme';

export function Dot({ color, size = 8 }) {
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

const TONES = {
    neutral: [C.surface3, C.ink2],
    ok: [C.okTint, C.ok],
    warn: [C.warnTint, C.warn],
    danger: [C.dangerTint, C.danger],
    accent: [C.accentTint, C.accent],
};

export function Chip({ children, tone = 'neutral', icon }) {
    const [bg, fg] = TONES[tone] || TONES.neutral;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: 'flex-start' }}>
            {icon}
            <Text style={{ color: fg, fontSize: 12.5, fontWeight: '600' }}>{children}</Text>
        </View>
    );
}

export function Avatar({ name = '', size = 38 }) {
    const ini = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.hairline }}>
            <Text style={{ color: C.ink2, fontWeight: '600', fontSize: size * 0.36 }}>{ini}</Text>
        </View>
    );
}
