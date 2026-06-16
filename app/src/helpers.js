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
