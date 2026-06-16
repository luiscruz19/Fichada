import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';
import { C, R, shadowPress } from '../theme';

// ---- Login por credenciales (el admin envía la invitación con usuario y clave) ----
export function LoginScreen({ t, onLogin, error, busy }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    return (
        <View style={{ flex: 1, padding: 26, justifyContent: 'center', backgroundColor: C.bg }}>
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Text style={{ color: C.onAccent, fontSize: 28, fontWeight: '700' }}>F</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: C.ink }}>{t('appNombre')}</Text>
                <Text style={{ fontSize: 14, color: C.ink3, marginTop: 4 }}>Registrá tu horario de trabajo</Text>
            </View>

            <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address"
                placeholderTextColor={C.ink3} style={inputStyle} />
            <TextInput value={password} onChangeText={setPassword} placeholder="Contraseña" secureTextEntry
                placeholderTextColor={C.ink3} style={[inputStyle, { marginTop: 12 }]} />

            {error ? <Text style={{ color: C.danger, fontSize: 13, fontWeight: '600', marginTop: 12 }}>{error}</Text> : null}

            <Pressable onPress={() => onLogin(email, password)} disabled={busy}
                style={[{ height: 56, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 22, opacity: busy ? 0.7 : 1 }, shadowPress]}>
                <Text style={{ color: C.onAccent, fontSize: 17, fontWeight: '700' }}>{busy ? t('cargando') : 'Activar mi cuenta'}</Text>
            </Pressable>
        </View>
    );
}

// ---- Teclado numérico ----
function PinPad({ onDigit, onDelete }) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300, alignSelf: 'center' }}>
            {keys.map((k, i) => (
                <View key={i} style={{ width: '33.33%', alignItems: 'center', paddingVertical: 8 }}>
                    {k === '' ? <View style={{ width: 72, height: 72 }} /> : (
                        <Pressable onPress={() => (k === 'del' ? onDelete() : onDigit(k))}
                            style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.surface3 : 'transparent' })}>
                            {k === 'del'
                                ? <Delete size={26} color={C.ink2} strokeWidth={1.7} />
                                : <Text style={{ fontSize: 28, fontWeight: '500', color: C.ink }}>{k}</Text>}
                        </Pressable>
                    )}
                </View>
            ))}
        </View>
    );
}

// ---- Pantalla de PIN (create | confirm | unlock) ----
export function PinScreen({ t, mode, name, error, onComplete, onBio }) {
    const [pin, setPin] = useState('');
    const titles = {
        create: t('crearPin'),
        confirm: t('repetirPin'),
        unlock: t('ingresaPin'),
    };
    function digit(d) {
        const next = (pin + d).slice(0, 4);
        setPin(next);
        if (next.length === 4) {
            setTimeout(() => { onComplete(next); setPin(''); }, 120);
        }
    }
    return (
        <View style={{ flex: 1, padding: 26, justifyContent: 'center', backgroundColor: C.bg }}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                {mode === 'unlock' && name ? <Text style={{ fontSize: 15, color: C.ink3, marginBottom: 6 }}>{name.split(' ')[0]}</Text> : null}
                <Text style={{ fontSize: 22, fontWeight: '700', color: C.ink }}>{titles[mode]}</Text>
                {mode === 'create' ? <Text style={{ fontSize: 14, color: C.ink3, marginTop: 6 }}>{t('crearPinMsg')}</Text> : null}
                {error ? <Text style={{ color: C.danger, fontSize: 14, fontWeight: '600', marginTop: 8 }}>{error}</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 34 }}>
                {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: i < pin.length ? C.accent : C.hairline2, backgroundColor: i < pin.length ? C.accent : 'transparent' }} />
                ))}
            </View>

            <PinPad onDigit={digit} onDelete={() => setPin((p) => p.slice(0, -1))} />

            {mode === 'unlock' && onBio ? (
                <Pressable onPress={onBio} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 26 }}>
                    <Fingerprint size={22} color={C.accent} strokeWidth={1.7} />
                    <Text style={{ color: C.accent, fontSize: 15.5, fontWeight: '600' }}>{t('usarBiometria')}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const inputStyle = {
    height: 52, borderRadius: R.md, borderWidth: 1.5, borderColor: C.hairline2,
    backgroundColor: C.surface, paddingHorizontal: 14, fontSize: 16, color: C.ink,
};
