import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';

import { C } from './src/theme';
import { makeT } from './src/i18n';
import { fmtTime } from './src/helpers';
import { loadToken, clearToken, login, getProfile, getStatus, clockIn, clockOut, startBreak, endBreak, listNotifications, markNotificationRead } from './src/api';
import { syncDevice } from './src/device';
import ClockScreen from './src/screens/ClockScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BlockedShiftScreen from './src/screens/BlockedShiftScreen';
import NotisSheet from './src/screens/NotisSheet';
import { LoginScreen, PinScreen } from './src/screens/AccessScreens';

// Mostrar las push entrantes también con la app abierta.
Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const PIN_KEY = 'fichada_pin';
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

    const [session, setSession] = useState('boot'); // boot|login|createPin|confirmPin|unlock|active
    const [pinDraft, setPinDraft] = useState('');
    const [authError, setAuthError] = useState(null);
    const [busy, setBusy] = useState(false);

    const [shift, setShift] = useState(null);
    const [estado, setEstado] = useState('fuera');
    const [name, setName] = useState('Empleado');
    const [targetMin, setTargetMin] = useState(480);
    const [view, setView] = useState('clock'); // clock | history
    const [notis, setNotis] = useState([]);
    const [notisOpen, setNotisOpen] = useState(false);

    // boot
    useEffect(() => {
        (async () => {
            const tk = await loadToken();
            if (!tk) { setSession('login'); return; }
            const pin = await SecureStore.getItemAsync(PIN_KEY);
            setSession(pin ? 'unlock' : 'active');
        })();
    }, []);

    const refresh = useCallback(async () => {
        try {
            const res = await getStatus();
            const data = res?.data || {};
            setEstado(STATUS_MAP[data.status] || 'fuera');
            setShift(data.shift || null);
        } catch (e) {
            if (e.status === 401) { await clearToken(); setSession('login'); }
        }
    }, []);

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

    async function onLogin(email, password) {
        setAuthError(null); setBusy(true);
        try {
            await login(email, password);
            const pin = await SecureStore.getItemAsync(PIN_KEY);
            setSession(pin ? 'active' : 'createPin');
        } catch (e) {
            setAuthError(e.message || 'No se pudo iniciar sesión');
        } finally {
            setBusy(false);
        }
    }

    async function onPin(mode, value) {
        if (mode === 'create') { setPinDraft(value); setAuthError(null); setSession('confirmPin'); }
        else if (mode === 'confirm') {
            if (value === pinDraft) { await SecureStore.setItemAsync(PIN_KEY, value); setSession('active'); }
            else { setAuthError(t('pinIncorrecto')); setSession('createPin'); }
        } else if (mode === 'unlock') {
            const stored = await SecureStore.getItemAsync(PIN_KEY);
            if (value === stored) { setAuthError(null); setSession('active'); }
            else setAuthError(t('pinIncorrecto'));
        }
    }

    async function onBio() {
        const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquear Fichada' });
        if (r.success) setSession('active');
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
    if (session === 'login') {
        content = <LoginScreen t={t} onLogin={onLogin} error={authError} busy={busy} />;
    } else if (session === 'createPin') {
        content = <PinScreen t={t} mode="create" error={authError} onComplete={(p) => onPin('create', p)} />;
    } else if (session === 'confirmPin') {
        content = <PinScreen t={t} mode="confirm" error={authError} onComplete={(p) => onPin('confirm', p)} />;
    } else if (session === 'unlock') {
        content = <PinScreen t={t} mode="unlock" name={name} error={authError} onComplete={(p) => onPin('unlock', p)} onBio={onBio} />;
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
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
            {content}
            <NotisSheet t={t} visible={notisOpen} items={notis} onClose={() => setNotisOpen(false)} onRead={markAllRead} />
        </SafeAreaView>
    );
}
