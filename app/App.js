import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getItem, setItem, IS_WEB } from './src/storage';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';

import { C } from './src/theme';
import { makeT } from './src/i18n';
import { fmtTime } from './src/helpers';
import { loadToken, clearToken, login, hasPin, loginPin, setPinRemote, getProfile, getStatus, clockIn, clockOut, startBreak, endBreak, listNotifications, markNotificationRead } from './src/api';
import { syncDevice } from './src/device';
import ClockScreen from './src/screens/ClockScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BlockedShiftScreen from './src/screens/BlockedShiftScreen';
import NotisSheet from './src/screens/NotisSheet';
import { EmailScreen, PasswordScreen, PinScreen } from './src/screens/AccessScreens';

// Push: Expo Go (SDK 53+) removió las push de Android. Solo configuramos el handler
// fuera de Expo Go (en el build EAS sí funcionan). Evita el error en consola de Expo Go.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
if (!IS_EXPO_GO) {
    // require lazy: evita cargar expo-notifications (y su error) en Expo Go.
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
}

const PIN_KEY = 'fichada_pin';
const EMAIL_KEY = 'fichada_email';
const LANG = 'es';

// ---- live clock ----
function useNow(ms = 1000) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
}

// ---- jornada desde el shift ----
function shiftToEvents(shift) {
    if (!shift) return [];
    const ev = [{ type: 'in', t: new Date(shift.check_in) }];
    (shift.breaks || []).forEach((b) => {
        ev.push({ type: 'break_start', t: new Date(b.break_start) });
        if (b.break_end) ev.push({ type: 'break_end', t: new Date(b.break_end) });
    });
    if (shift.check_out) ev.push({ type: 'out', t: new Date(shift.check_out) });
    ev.sort((a, b) => a.t - b.t);
    return ev;
}

function computeJornada(events, now) {
    let worked = 0, pausa = 0, working = false, onbreak = false, segStart = null, brStart = null;
    for (const ev of events) {
        if (ev.type === 'in') { working = true; segStart = ev.t; }
        else if (ev.type === 'out') { if (working && segStart) worked += ev.t - segStart; working = false; segStart = null; }
        else if (ev.type === 'break_start') { if (working && segStart) worked += ev.t - segStart; working = false; onbreak = true; brStart = ev.t; }
        else if (ev.type === 'break_end') { if (onbreak) pausa += ev.t - brStart; onbreak = false; working = true; segStart = ev.t; }
    }
    if (working && segStart) worked += now - segStart;
    if (onbreak && brStart) pausa += now - brStart;
    return { workedMin: worked / 60000, pausaMin: pausa / 60000 };
}

const STATUS_MAP = { out: 'fuera', in: 'trabajando', on_break: 'pausa' };

async function captureLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        const e = new Error('Necesitás habilitar la ubicación para fichar.');
        e.code = 'gps';
        throw e;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
}

export default function App() {
    const t = useMemo(() => makeT(LANG), []);
    const now = useNow(1000);

    // boot | emailEntry | loginPassword | createPin | confirmPin | loginPin | active
    const [session, setSession] = useState('boot');
    const [email, setEmail] = useState('');
    const [pinDraft, setPinDraft] = useState('');
    const [canBio, setCanBio] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [busy, setBusy] = useState(false);

    const [shift, setShift] = useState(null);
    const [estado, setEstado] = useState('fuera');
    const [name, setName] = useState('Empleado');
    const [targetMin, setTargetMin] = useState(null); // se llena con el target_hours real del perfil
    const [view, setView] = useState('clock'); // clock | history
    const [notis, setNotis] = useState([]);
    const [notisOpen, setNotisOpen] = useState(false);

    // Lleva a la pantalla de ingreso "correcta": si este teléfono ya tiene una cuenta
    // con PIN, va DIRECTO a pedir el PIN (no vuelve a pedir el email). Solo muestra la
    // pantalla de email en el primer uso (sin email guardado) o si no se puede resolver.
    const goToLogin = useCallback(async () => {
        const last = await getItem(EMAIL_KEY);
        if (!last) { setSession('emailEntry'); return; }
        setEmail(last);
        const localPin = await getItem(PIN_KEY);
        const hw = await LocalAuthentication.hasHardwareAsync().catch(() => false);
        const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
        setCanBio(!!localPin && hw && enrolled);
        // PIN ya configurado en este teléfono → directo al PIN (offline-friendly).
        if (localPin) { setSession('loginPin'); return; }
        // Sin PIN local: preguntamos al servidor si la cuenta ya tiene PIN.
        try {
            const res = await hasPin(last);
            setSession(res?.has_pin ? 'loginPin' : 'loginPassword');
        } catch {
            setSession('emailEntry');
        }
    }, []);

    // boot: si hay sesión guardada entra directo; si no, va al ingreso recordando el email.
    useEffect(() => {
        (async () => {
            const tk = await loadToken();
            if (tk) { setSession('active'); return; }
            await goToLogin();
        })();
    }, [goToLogin]);

    // Al llegar a la pantalla de PIN con biometría disponible, la disparamos sola
    // (como las apps de banco): si la cancelás, queda el teclado de PIN.
    const bioTried = useRef(false);
    useEffect(() => {
        if (session === 'loginPin' && canBio && !IS_WEB && !bioTried.current) {
            bioTried.current = true;
            onBio();
        }
        if (session !== 'loginPin') bioTried.current = false;
    }, [session, canBio]);

    const refresh = useCallback(async () => {
        try {
            const res = await getStatus();
            const data = res?.data || {};
            setEstado(STATUS_MAP[data.status] || 'fuera');
            setShift(data.shift || null);
        } catch (e) {
            if (e.status === 401) { await clearToken(); await goToLogin(); }
        }
    }, [goToLogin]);

    // Perfil real del empleado (nombre + objetivo de jornada), desde el backend.
    const loadProfile = useCallback(async () => {
        try {
            const res = await getProfile();
            const p = res?.data;
            if (p) {
                const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                if (full) setName(full);
                if (p.target_hours) setTargetMin(Math.round(Number(p.target_hours) * 60));
            }
        } catch (e) { /* perfil no crítico para fichar */ }
    }, []);

    const loadNotis = useCallback(async () => {
        try { const res = await listNotifications(); setNotis(res?.data || []); } catch { /* no crítico */ }
    }, []);

    useEffect(() => {
        if (session === 'active') { refresh(); loadProfile(); syncDevice(); loadNotis(); }
    }, [session, refresh, loadProfile, loadNotis]);

    async function openNotis() { await loadNotis(); setNotisOpen(true); }
    async function markAllRead() {
        const unread = notis.filter((n) => !n.read_at);
        await Promise.all(unread.map((n) => markNotificationRead(n.id).catch(() => { })));
        await loadNotis();
    }

    // Paso 1: email → ¿tiene PIN? → pide PIN, o pide contraseña (primer ingreso).
    async function onContinueEmail(em) {
        const e = String(em || '').trim().toLowerCase();
        if (!e) { setAuthError('Ingresá tu email'); return; }
        setEmail(e); setAuthError(null); setBusy(true);
        try {
            await setItem(EMAIL_KEY, e);
            const res = await hasPin(e);
            if (res?.has_pin) {
                const localPin = await getItem(PIN_KEY);
                const hw = await LocalAuthentication.hasHardwareAsync().catch(() => false);
                const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
                setCanBio(!!localPin && hw && enrolled);
                setSession('loginPin');
            } else {
                setSession('loginPassword');
            }
        } catch {
            setAuthError('No se pudo conectar con el servidor');
        } finally {
            setBusy(false);
        }
    }

    // Paso 2a: primer ingreso con contraseña temporal → crear PIN.
    async function onLoginPassword(password) {
        setAuthError(null); setBusy(true);
        try {
            await login(email, password);
            setSession('createPin');
        } catch (e) {
            setAuthError(e.message || 'No se pudo iniciar sesión');
        } finally {
            setBusy(false);
        }
    }

    async function onPin(mode, value) {
        if (mode === 'create') { setPinDraft(value); setAuthError(null); setSession('confirmPin'); }
        else if (mode === 'confirm') {
            if (value !== pinDraft) { setAuthError(t('pinIncorrecto')); setSession('createPin'); return; }
            setBusy(true);
            try {
                await setPinRemote(value);     // guarda el PIN en la base
                await setItem(PIN_KEY, value); // y local, para la biometría en este teléfono
                setAuthError(null); setSession('active');
            } catch {
                setAuthError('No se pudo guardar el PIN'); setSession('createPin');
            } finally { setBusy(false); }
        } else if (mode === 'login') {
            setBusy(true);
            try {
                await loginPin(email, value);  // login con email + PIN
                await setItem(PIN_KEY, value); // recuerda el PIN local (biometría)
                setAuthError(null); setSession('active');
            } catch (e) {
                setAuthError(e.message || t('pinIncorrecto'));
            } finally { setBusy(false); }
        }
    }

    // Biometría: usa el PIN guardado localmente para entrar sin tipearlo.
    async function onBio() {
        try {
            const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Ingresar a Fichada' });
            if (!r.success) return;
            const localPin = await getItem(PIN_KEY);
            if (!localPin) return;
            await loginPin(email, localPin);
            setSession('active');
        } catch (e) {
            setAuthError(e.message || t('pinIncorrecto'));
        }
    }

    async function doAction(kind) {
        if (busy) return;
        setBusy(true);
        try {
            if (kind === 'break_start') {
                await startBreak();
            } else if (kind === 'break_end') {
                await endBreak();
            } else {
                const loc = await captureLocation();
                if (kind === 'in') await clockIn(loc.lat, loc.lng, loc.accuracy);
                else await clockOut(loc.lat, loc.lng, loc.accuracy);
            }
            await refresh();
        } catch (e) {
            Alert.alert(
                e.code === 'gps' ? t('gpsTitulo') : 'No se pudo fichar',
                e.message || t('sinConexionMsg')
            );
        } finally {
            setBusy(false);
        }
    }

    // ---- render ----
    if (session === 'boot') {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
                <ActivityIndicator color={C.accent} />
            </View>
        );
    }

    // ¿Hay una jornada abierta de un día anterior? → bloquea hasta cerrarla.
    const prevDayOpen = (() => {
        if (!shift || shift.status === 'closed' || !shift.check_in) return false;
        const ci = new Date(shift.check_in);
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        return ci < start;
    })();

    let content;
    if (session === 'emailEntry') {
        content = <EmailScreen t={t} onContinue={onContinueEmail} error={authError} busy={busy} initialEmail={email} />;
    } else if (session === 'loginPassword') {
        content = <PasswordScreen t={t} email={email} onLogin={onLoginPassword} onBack={() => { setAuthError(null); setSession('emailEntry'); }} error={authError} busy={busy} />;
    } else if (session === 'createPin') {
        content = <PinScreen t={t} mode="create" error={authError} onComplete={(p) => onPin('create', p)} />;
    } else if (session === 'confirmPin') {
        content = <PinScreen t={t} mode="confirm" error={authError} onComplete={(p) => onPin('confirm', p)} />;
    } else if (session === 'loginPin') {
        content = <PinScreen t={t} mode="login" email={email} error={authError} onComplete={(p) => onPin('login', p)} onBio={(canBio && !IS_WEB) ? onBio : undefined} onBack={() => { setAuthError(null); setSession('emailEntry'); }} />;
    } else if (view === 'history') {
        content = <HistoryScreen t={t} lang={LANG} onBack={() => setView('clock')} />;
    } else if (prevDayOpen) {
        content = <BlockedShiftScreen t={t} lang={LANG} shift={shift} busy={busy} onClose={() => doAction('out')} />;
    } else {
        const events = shiftToEvents(shift);
        const { workedMin, pausaMin } = computeJornada(events, now);
        const sinceLabel = (() => {
            if (estado === 'trabajando') {
                const last = [...events].reverse().find((e) => e.type === 'in' || e.type === 'break_end');
                return last ? fmtTime(last.t) : null;
            }
            if (estado === 'pausa') {
                const last = [...events].reverse().find((e) => e.type === 'break_start');
                return last ? fmtTime(last.t) : null;
            }
            return null;
        })();

        content = (
            <ClockScreen
                t={t} lang={LANG} now={now} name={name} estado={estado} sinceLabel={sinceLabel}
                workedMin={workedMin} targetMin={targetMin} pausaMin={pausaMin} events={events}
                busy={busy}
                onPrimary={(kind) => doAction(kind)}
                onPause={() => doAction('break_start')}
                onClockOut={() => doAction('out')}
                onHistory={() => setView('history')}
                onMenu={() => Alert.alert(t('appNombre'), `${name}\n${t('dispositivoVinculado')}`)}
                onBell={openNotis}
                notiCount={notis.filter((n) => !n.read_at).length}
            />
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
                <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
                {content}
                <NotisSheet t={t} visible={notisOpen} items={notis} onClose={() => setNotisOpen(false)} onRead={markAllRead} />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
