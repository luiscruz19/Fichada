export const DEFAULT_TOLERANCE_MIN = 5;

export type PunctualityRules = {
    toleranceMinutes?: number | null;
    defaultExpectedCheckIn?: string | null;
};

export function hhmmToMin(value?: string | null): number | null {
    if (!value) return null;
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

export function expectedCheckInMin(own: string | null | undefined, rules: PunctualityRules): number | null {
    return hhmmToMin(own ?? rules.defaultExpectedCheckIn);
}

export function isPunctual(checkInMin: number, expectedMin: number, rules: PunctualityRules): boolean {
    return checkInMin <= expectedMin + (rules.toleranceMinutes ?? DEFAULT_TOLERANCE_MIN);
}
