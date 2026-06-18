import { Platform } from 'react-native';
import * as ExpoDevice from 'expo-device';
import Constants from 'expo-constants';
import { getItem, setItem } from './storage';
import { registerDevice } from './api';

// En Expo Go (SDK 53+) las push de Android no están disponibles → no las pedimos.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

const UUID_KEY = 'fichada_device_uuid';

// Identificador estable del dispositivo (device-binding): se genera una vez y persiste.
async function getDeviceUuid() {
    let id = await getItem(UUID_KEY);
    if (!id) {
        id = `${Platform.OS}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        await setItem(UUID_KEY, id);
    }
    return id;
}

// Push token de Expo (best-effort: requiere permisos y projectId/EAS; si falla, null).
async function getPushToken() {
    if (IS_EXPO_GO) return null; // push no disponible en Expo Go
    const Notifications = require('expo-notifications'); // lazy: solo fuera de Expo Go
    try {
        // Android requiere un canal de notificaciones para mostrar las push (API 26+).
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Avisos de Fichada',
                importance: Notifications.AndroidImportance.DEFAULT,
            });
        }
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== 'granted') return null;
        // En builds EAS standalone el token se firma con el projectId del proyecto.
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const tok = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        return tok?.data || null;
    } catch {
        return null;
    }
}

/**
 * Registra/actualiza este dispositivo en el backend (device-binding estricto + push token).
 * No es crítico para fichar: si falla, no rompe el flujo.
 */
export async function syncDevice() {
    try {
        const device_uuid = await getDeviceUuid();
        const push_token = await getPushToken();
        await registerDevice({
            device_uuid,
            platform: Platform.OS,
            model: ExpoDevice.modelName || null,
            push_token,
        });
    } catch (e) {
        // device-binding rechazado u offline: el fichaje sigue funcionando.
    }
}
