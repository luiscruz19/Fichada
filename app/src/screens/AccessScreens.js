import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Delete, Fingerprint, ArrowLeft } from 'lucide-react-native';
import { C, R, shadowPress } from '../theme';

function Brand({ subtitle }) {
    return (
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Text style={{ color: C.onAccent, fontSize: 28, fontWeight: '700' }}>F</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: C.ink }}>Fichada</Text>
            {subtitle ? <Text style={{ fontSize: 14, color: C.ink3, marginTop: 4 }}>{subtitle}</Text> : null}
        </View>
    );
}

// ---- Paso 1: email ----
export function EmailScreen({ t, onContinue, busy, error, initialEmail }) {
    const [email, setEmail] = useState(initialEmail || '');
    return (
        <View style={{ flex: 1, padding: 26, justifyContent: 'center', backgroundColor: C.bg }}>
            <Brand subtitle="Registrá tu horario de trabajo" />
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" autoFocus
                placeholderTextColor={C.ink3} style={inputStyle} onSubmitEditing={() => onContinue(email)} />
            {error ? <Text style={{ color: C.danger, fontSize: 13, fontWeight: '600', marginTop: 12 }}>{error}</Text> : null}
            <Pressable onPress={() => onContinue(email)} disabled={busy}
                style={[{ height: 56, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 22, opacity: busy ? 0.7 : 1 }, shadowPress]}>
                <Text style={{ color: C.onAccent, fontSize: 17, fontWeight: '700' }}>{busy ? t('cargando') : 'Continuar'}</Text>
            </Pressable>
        </View>
    );
}

// ---- Paso 2a (primer ingreso): contraseña temporal ----
export function PasswordScreen({ t, email, onLogin, onBack, error, busy }) {
    const [password, setPassword] = useState('');
    return (
        <View style={{ flex: 1, padding: 26, justifyContent: 'center', backgroundColor: C.bg }}>
            <Brand subtitle="Primer ingreso" />
            <Text style={{ fontSize: 14, color: C.ink2, textAlign: 'center', marginBottom: 14 }}>{email}</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="Contraseña temporal" secureTextEntry autoFocus
                placeholderTextColor={C.ink3} style={inputStyle} onSubmitEditing={() => onLogin(password)} />
            {error ? <Text style={{ color: C.danger, fontSize: 13, fontWeight: '600', marginTop: 12 }}>{error}</Text> : null}
            <Pressable onPress={() => onLogin(password)} disabled={busy}
                style={[{ height: 56, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 22, opacity: busy ? 0.7 : 1 }, shadowPress]}>
                <Text style={{ color: C.onAccent, fontSize: 17, fontWeight: '700' }}>{busy ? t('cargando') : 'Ingresar'}</Text>
            </Pressable>
            <Pressable onPress={onBack} style={{ marginTop: 18, alignItems: 'center' }}>
                <Text style={{ color: C.ink3, fontSize: 14, fontWeight: '600' }}>Cambiar email</Text>
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

// ---- PIN: create | confirm | login (email + PIN) ----
export function PinScreen({ t, mode, email, error, onComplete, onBio, onBack }) {
    const [pin, setPin] = useState('');
    const titles = { create: t('crearPin'), confirm: t('repetirPin'), login: t('ingresaPin') };
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
                {mode === 'login' && email ? <Text style={{ fontSize: 14, color: C.ink3, marginBottom: 6 }}>{email}</Text> : null}
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

            {mode === 'login' && onBio ? (
                <Pressable onPress={onBio} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 26 }}>
                    <Fingerprint size={22} color={C.accent} strokeWidth={1.7} />
                    <Text style={{ color: C.accent, fontSize: 15.5, fontWeight: '600' }}>{t('usarBiometria')}</Text>
                </Pressable>
            ) : null}

            {mode === 'login' && onBack ? (
                <Pressable onPress={onBack} style={{ marginTop: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={16} color={C.ink3} strokeWidth={1.7} />
                    <Text style={{ color: C.ink3, fontSize: 14, fontWeight: '600' }}>Cambiar email</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const inputStyle = {
    height: 52, borderRadius: R.md, borderWidth: 1.5, borderColor: C.hairline2,
    backgroundColor: C.surface, paddingHorizontal: 14, fontSize: 16, color: C.ink,
};
