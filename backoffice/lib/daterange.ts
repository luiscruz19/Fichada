// Rango de fechas para reportes/métricas. Las fechas se manejan como claves locales
// (YYYY-MM-DD) en hora de Argentina (UTC−3) y se convierten a instantes UTC para el api.

const OFFSET_H = -3;
const pad = (n: number) => String(n).padStart(2, '0');
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function keyFromDate(d: Date): string {
    const s = new Date(d.getTime() + OFFSET_H * 3600 * 1000);
    return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

export function todayKeyAR(): string {
    return keyFromDate(new Date());
}

export function addDaysKey(key: string, n: number): string {
    const [y, m, d] = key.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d) + n * 86400000;
    const x = new Date(t);
    return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

export function monthStartKey(key: string): string {
    const [y, m] = key.split('-').map(Number);
    return `${y}-${pad(m)}-01`;
}

export function fmtKeyShort(key: string): string {
    const [y, m, d] = key.split('-').map(Number);
    return `${d} ${MES[m - 1]}`;
}

export function fmtKeyLong(key: string): string {
    const [y, m, d] = key.split('-').map(Number);
    return `${d} ${MES[m - 1]} ${y}`;
}

// Cantidad de días (inclusive) entre dos claves.
export function daysBetween(fromKey: string, toKey: string): number {
    const [fy, fm, fd] = fromKey.split('-').map(Number);
    const [ty, tm, td] = toKey.split('-').map(Number);
    return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000) + 1;
}

export type PresetKey = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'all';

export const PRESETS: { key: PresetKey; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'yesterday', label: 'Ayer' },
    { key: '7d', label: '7 días' },
    { key: '30d', label: '30 días' },
    { key: 'month', label: 'Este mes' },
    { key: 'all', label: 'Todo' },
];

// Rango {from,to} de un preset, relativo a hoy (AR). 'all' → sin límites.
export function presetRange(preset: PresetKey): { fromKey: string | null; toKey: string | null } {
    const today = todayKeyAR();
    switch (preset) {
        case 'today': return { fromKey: today, toKey: today };
        case 'yesterday': { const y = addDaysKey(today, -1); return { fromKey: y, toKey: y }; }
        case '7d': return { fromKey: addDaysKey(today, -6), toKey: today };
        case '30d': return { fromKey: addDaysKey(today, -29), toKey: today };
        case 'month': return { fromKey: monthStartKey(today), toKey: today };
        case 'all': default: return { fromKey: null, toKey: null };
    }
}

export type ResolvedRange = { fromKey: string | null; toKey: string | null; label: string };

const isKey = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Lee el rango desde los searchParams del server component.
export function resolveRange(sp: { from?: string; to?: string }): ResolvedRange {
    const fromKey = isKey(sp.from) ? sp.from! : null;
    const toKey = isKey(sp.to) ? sp.to! : null;
    let label = 'Todo el historial';
    if (fromKey && toKey) label = fromKey === toKey ? fmtKeyLong(fromKey) : `${fmtKeyShort(fromKey)} – ${fmtKeyLong(toKey)}`;
    else if (fromKey) label = `desde ${fmtKeyLong(fromKey)}`;
    else if (toKey) label = `hasta ${fmtKeyLong(toKey)}`;
    return { fromKey, toKey, label };
}

// Convierte el rango (claves locales AR) a query string para el api: filtra por check_in
// entre el 00:00 del día `from` y el 23:59:59.999 del día `to`, ambos en hora AR.
export function rangeToApiQuery(fromKey: string | null, toKey: string | null, extra?: Record<string, string>): string {
    const params = new URLSearchParams(extra || {});
    if (fromKey) params.set('from', `${fromKey}T03:00:00.000Z`);
    if (toKey) params.set('to', `${addDaysKey(toKey, 1)}T02:59:59.999Z`);
    return params.toString();
}
