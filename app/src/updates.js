import { Alert } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

let buscando = false;

// Qué versión corre este teléfono: la del build y, si está corriendo una actualización OTA,
// sus primeros 8 hex y cuándo se publicó. Es dato de soporte ("¿le llegó el arreglo o no?").
export function versionDetalle() {
    const app = Constants.expoConfig?.version ?? '1.0.0';
    let ota = 'build integrado';
    try {
        if (Updates.isEnabled && !Updates.isEmbeddedLaunch && Updates.updateId) {
            const corto = Updates.updateId.replace(/-/g, '').slice(0, 8);
            const at = Updates.createdAt
                ? `${Updates.createdAt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${Updates.createdAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                : '';
            ota = `OTA ${corto}${at ? ' · ' + at : ''}`;
        }
    } catch { /* en Expo Go / dev client expo-updates no está activo */ }
    return `v${app} · ${ota}`;
}

/**
 * Busca una versión nueva y la aplica. Con jornada abierta NO reinicia sola: deja el bundle
 * descargado (entra en el próximo arranque) porque reiniciar a mitad de jornada le corta la
 * pantalla al que está por fichar. `silencioso` es para el chequeo automático al volver a
 * primer plano: ahí no hay que sacar carteles si no hay nada nuevo.
 */
export async function buscarActualizacion({ silencioso = false, hayJornadaAbierta = false } = {}) {
    if (buscando) return;
    if (!Updates.isEnabled) {
        if (!silencioso) Alert.alert('Fichada', `${versionDetalle()}\n\nLas actualizaciones solo funcionan en la app instalada.`);
        return;
    }
    buscando = true;
    try {
        const res = await Updates.checkForUpdateAsync();
        if (!res.isAvailable) {
            if (!silencioso) Alert.alert('Fichada', `${versionDetalle()}\n\nYa tenés la última versión.`);
            return;
        }
        await Updates.fetchUpdateAsync();

        if (hayJornadaAbierta) {
            Alert.alert(
                'Hay una versión nueva',
                'Ya está descargada. Como tenés una jornada abierta no reiniciamos ahora: se aplica sola la próxima vez que abras la app.',
            );
            return;
        }

        if (silencioso) {
            await Updates.reloadAsync();
            return;
        }
        Alert.alert(
            'Hay una versión nueva',
            'Ya está descargada. Reiniciamos la app para aplicarla.',
            [
                { text: 'Ahora no', style: 'cancel' },
                { text: 'Reiniciar', onPress: () => { void Updates.reloadAsync(); } },
            ],
        );
    } catch (e) {
        if (!silencioso) Alert.alert('Fichada', 'No se pudo buscar la actualización. Probá de nuevo con conexión.');
    } finally {
        buscando = false;
    }
}
