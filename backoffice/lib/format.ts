const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Toda fecha/hora se muestra en la hora oficial (Argentina, UTC−3), sin importar dónde
// se renderice: el server corre en UTC, y los navegadores en su TZ local. Formatear con
// getHours()/getDate() usaría la TZ del entorno → horas inconsistentes. Por eso fijamos
// la zona con Intl.
const TZ = 'America/Argentina/Buenos_Aires';
const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function tzParts(iso: string): Record<string, string> {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, hour12: false,
        weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const p: Record<string, string> = {};
    for (const part of fmt.formatToParts(new Date(iso))) p[part.type] = part.value;
    return p;
}

export function fmtTime(iso?: string | null): string | null {
    if (!iso) return null;
    const p = tzParts(iso);
    return `${p.hour === '24' ? '00' : p.hour}:${p.minute}`;
}

export function fmtDateShort(iso?: string | null): string {
    if (!iso) return '';
    const p = tzParts(iso);
    return `${DIAS[WEEKDAY[p.weekday] ?? 0]} ${Number(p.day)} ${MESES[Number(p.month) - 1]}`;
}

export function secondsToHHMM(s?: number | null): string {
    if (s == null) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h === 0 ? `${m}m` : `${h}h ${String(m).padStart(2, '0')}m`;
}

export function initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
