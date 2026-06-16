import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ExpoDevice from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerDevice } from './api';

const UUID_KEY = 'fichada_device_uuid';

// Identificador estable del dispositivo (device-binding): se genera una vez y persiste.
async function getDeviceUuid() {
    let id = await SecureStore.getItemAsync(UUID_KEY);
    if (!id) {
        id = `${Platform.OS}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        await SecureStore.setItemAsync(UUID_KEY, id);
    }
    return id;
}

// Push token de Expo (best-effort: requiere permisos y projectId/EAS; si falla, null).
async function getPushToken() {
    try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== 'granted') return null;
        const tok = await Notifications.getExpoPushTokenAsync();
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
