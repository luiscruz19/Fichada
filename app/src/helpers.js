export const pad = (n) => String(n).padStart(2, '0');

export function fmtTime(d) {
    const x = d instanceof Date ? d : new Date(d);
    return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function fmtTimeFromISO(iso) {
    if (!iso) return null;
    return fmtTime(new Date(iso));
}

export function fmtDur(mins) {
    mins = Math.max(0, Math.round(mins));
    const h = Math.floor(mins / 60), m = mins % 60;
    return h === 0 ? `${m}m` : `${h}h ${pad(m)}m`;
}

export function fmtDateLong(d, lang) {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    if (lang === 'en') {
        return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
}

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Hora oficial Argentina: UTC−3 fijo, sin horario de verano. Misma convención que la API
// y el backoffice. No usamos getHours()/getDate() porque devuelven la zona del teléfono:
// un celular mal configurado o un emulador en UTC corrían el día de la solicitud.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

// Día calendario argentino y minutos desde medianoche de un ISO.
export function partesAr(iso) {
    const d = new Date(new Date(iso).getTime() - AR_OFFSET_MS);
    return {
        y: d.getUTCFullYear(),
        mes: d.getUTCMonth() + 1,
        dia: d.getUTCDate(),
        min: d.getUTCHours() * 60 + d.getUTCMinutes(),
    };
}

// Arma el instante (ISO en UTC, como espera la API) tomando el DÍA argentino de isoBase y
// aplicándole `minutos` desde medianoche. diaSiguiente suma 24h para el turno nocturno.
export function isoDesdeMinutosAr(isoBase, minutos, diaSiguiente = false) {
    const p = partesAr(isoBase);
    const medianocheArEnUtc = Date.UTC(p.y, p.mes - 1, p.dia) + AR_OFFSET_MS;
    const ms = medianocheArEnUtc + (minutos + (diaSiguiente ? 1440 : 0)) * 60000;
    return new Date(ms).toISOString();
}

// 'HH:MM' desde minutos. Imposible desbordar: el rango se acota antes.
export const fmtMinutos = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
