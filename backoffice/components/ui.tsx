import React from 'react';

type Tone = 'ok' | 'warn' | 'danger' | 'neutral' | 'accent';

const TONES: Record<Tone, [string, string]> = {
    ok: ['var(--ok-tint)', 'var(--ok)'],
    warn: ['var(--warn-tint)', 'var(--warn)'],
    danger: ['var(--danger-tint)', 'var(--danger)'],
    neutral: ['var(--surface-3)', 'var(--ink-2)'],
    accent: ['var(--accent-tint)', 'var(--accent)'],
};

export function ChipTone({ tone = 'neutral', children, icon }: { tone?: Tone; children: React.ReactNode; icon?: React.ReactNode }) {
    const [bg, fg] = TONES[tone] || TONES.neutral;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: fg, padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {icon}{children}
        </span>
    );
}

export function Avatar({ ini, size = 30 }: { ini: string; size?: number }) {
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, border: '1px solid var(--hairline)', flexShrink: 0 }}>
            {ini}
        </div>
    );
}

export function initials(name: string) {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
