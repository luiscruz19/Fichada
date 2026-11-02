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

// UTC−3 fijo. getHours() y getDate() dan la zona del teléfono: uno mal configurado corre el día.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;
const MS_POR_MINUTO = 60 * 1000;
export const MINUTOS_POR_DIA = 24 * 60;

export function partesAr(iso) {
    const d = new Date(new Date(iso).getTime() - AR_OFFSET_MS);
    return {
        y: d.getUTCFullYear(),
        mes: d.getUTCMonth() + 1,
        dia: d.getUTCDate(),
        min: d.getUTCHours() * 60 + d.getUTCMinutes(),
    };
}

export function isoDesdeMinutosAr(isoBase, minutos, diaSiguiente = false) {
    const p = partesAr(isoBase);
    const medianocheArEnUtc = Date.UTC(p.y, p.mes - 1, p.dia) + AR_OFFSET_MS;
    const ms = medianocheArEnUtc + (minutos + (diaSiguiente ? MINUTOS_POR_DIA : 0)) * MS_POR_MINUTO;
    return new Date(ms).toISOString();
}

export const fmtMinutos = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
