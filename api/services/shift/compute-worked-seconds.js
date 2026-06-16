/**
 * Tiempo trabajado = (salida − entrada) − suma de las pausas, en segundos.
 * Nunca devuelve negativo.
 */
export default function computeWorkedSeconds(checkIn, checkOut, breaks = []) {
    const gross = Math.floor((new Date(checkOut) - new Date(checkIn)) / 1000);
    const paused = breaks.reduce((acc, b) => acc + (b.duration_seconds || 0), 0);
    return Math.max(0, gross - paused);
}
