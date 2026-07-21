import type { Shift } from './types';

export const TZ = 'America/Argentina/Buenos_Aires';

// Partes de un instante en hora local (AR): hora, minuto y clave de fecha YYYY-MM-DD.
export function localParts(iso: string): { h: number; m: number; dateKey: string; dow: number } {
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', weekday: 'short',
    });
    const p: Record<string, string> = {};
    for (const part of fmt.formatToParts(d)) p[part.type] = part.value;
    const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
        h: Number(p.hour), m: Number(p.minute),
        dateKey: `${p.year}-${p.month}-${p.day}`,
        dow: dowMap[p.weekday] ?? 0,
    };
}

export function todayKey(): string {
    return localParts(new Date().toISOString()).dateKey;
}

// "HH:MM[:SS]" → minutos desde medianoche. null si no parsea.
function hhmmToMin(s?: string | null): number | null {
    if (!s) return null;
    const m = /^(\d{1,2}):(\d{2})/.exec(s);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
}

export type PersonMetric = {
    id: number;
    name: string;
    email?: string;
    count: number;
    seconds: number;
    open: number;
    avgSeconds: number;
    avgCheckinMin: number | null;   // hora promedio de entrada (min desde 00:00)
    punctualPct: number | null;     // % de entradas puntuales
    lastCheckIn: string | null;
};

export type Metrics = {
    totalSeconds: number;
    shiftsCount: number;
    openCount: number;
    employeesCount: number;
    avgShiftSeconds: number;
    secondsToday: number;
    secondsWeek: number;
    avgCheckinMin: number | null;
    avgCheckoutMin: number | null;
    punctualPct: number | null;
    perPerson: PersonMetric[];
    daily: { key: string; label: string; seconds: number }[];
};

// Tolerancia (min) para considerar puntual. El backoffice no recibe la de Ajustes en
// este server component, así que usamos un margen razonable por defecto.
const PUNCTUAL_TOLERANCE_MIN = 5;

export function computeMetrics(shifts: Shift[]): Metrics {
    const tk = todayKey();

    // Semana: set de las últimas 7 claves de fecha (incluyendo hoy).
    const weekKeys = new Set<string>();
    {
        const base = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(base.getTime() - i * 86400000);
            weekKeys.add(localParts(d.toISOString()).dateKey);
        }
    }

    const per = new Map<number, PersonMetric & { _ci: number[]; _punc: [number, number] }>();
    let totalSeconds = 0, openCount = 0, secondsToday = 0, secondsWeek = 0;
    const allCheckin: number[] = [];
    const allCheckout: number[] = [];
    let punctOk = 0, punctTotal = 0;

    // Serie diaria: últimos 14 días.
    const dailyMap = new Map<string, number>();
    const dayLabels: { key: string; label: string }[] = [];
    {
        const base = new Date();
        const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(base.getTime() - i * 86400000);
            const lp = localParts(d.toISOString());
            dailyMap.set(lp.dateKey, 0);
            const [, , dd] = lp.dateKey.split('-');
            dayLabels.push({ key: lp.dateKey, label: `${Number(dd)} ${MES[d.getMonth()]}` });
        }
    }

    for (const s of shifts) {
        const secs = s.worked_seconds || 0;
        totalSeconds += secs;
        if (s.status === 'open') openCount++;

        const ci = localParts(s.check_in);
        if (ci.dateKey === tk) secondsToday += secs;
        if (weekKeys.has(ci.dateKey)) secondsWeek += secs;
        if (dailyMap.has(ci.dateKey)) dailyMap.set(ci.dateKey, (dailyMap.get(ci.dateKey) || 0) + secs);

        const ciMin = ci.h * 60 + ci.m;
        allCheckin.push(ciMin);
        if (s.check_out) allCheckout.push((() => { const co = localParts(s.check_out); return co.h * 60 + co.m; })());

        // Puntualidad contra la hora esperada del empleado.
        const expected = hhmmToMin(s.employee?.expected_check_in);
        let personPunctOk = 0, personPunctTotal = 0;
        if (expected != null) {
            punctTotal++; personPunctTotal = 1;
            if (ciMin <= expected + PUNCTUAL_TOLERANCE_MIN) { punctOk++; personPunctOk = 1; }
        }

        const name = s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : `#${s.employee_id}`;
        const cur = per.get(s.employee_id) || {
            id: s.employee_id, name, email: s.employee?.email,
            count: 0, seconds: 0, open: 0, avgSeconds: 0,
            avgCheckinMin: null, punctualPct: null, lastCheckIn: null,
            _ci: [], _punc: [0, 0] as [number, number],
        };
        cur.count++;
        cur.seconds += secs;
        if (s.status === 'open') cur.open++;
        cur._ci.push(ciMin);
        cur._punc[0] += personPunctOk; cur._punc[1] += personPunctTotal;
        if (!cur.lastCheckIn || new Date(s.check_in) > new Date(cur.lastCheckIn)) cur.lastCheckIn = s.check_in;
        per.set(s.employee_id, cur);
    }

    const perPerson: PersonMetric[] = [...per.values()].map((p) => ({
        id: p.id, name: p.name, email: p.email,
        count: p.count, seconds: p.seconds, open: p.open,
        avgSeconds: p.count ? Math.round(p.seconds / p.count) : 0,
        avgCheckinMin: p._ci.length ? Math.round(p._ci.reduce((a, b) => a + b, 0) / p._ci.length) : null,
        punctualPct: p._punc[1] ? Math.round((p._punc[0] / p._punc[1]) * 100) : null,
        lastCheckIn: p.lastCheckIn,
    })).sort((a, b) => b.seconds - a.seconds);

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return {
        totalSeconds,
        shiftsCount: shifts.length,
        openCount,
        employeesCount: perPerson.length,
        avgShiftSeconds: shifts.length ? Math.round(totalSeconds / shifts.length) : 0,
        secondsToday, secondsWeek,
        avgCheckinMin: avg(allCheckin),
        avgCheckoutMin: avg(allCheckout),
        punctualPct: punctTotal ? Math.round((punctOk / punctTotal) * 100) : null,
        perPerson,
        daily: dayLabels.map((d) => ({ key: d.key, label: d.label, seconds: dailyMap.get(d.key) || 0 })),
    };
}

export function minToHHMM(min?: number | null): string {
    if (min == null) return '—';
    const h = Math.floor(min / 60), m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
