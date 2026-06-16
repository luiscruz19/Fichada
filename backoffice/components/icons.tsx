import React from 'react';

type IconProps = { size?: number; sw?: number; fill?: string; style?: React.CSSProperties; children?: React.ReactNode };

function Icon({ size = 24, sw = 1.7, fill = 'none', style, children }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
            strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
            style={{ display: 'block', flexShrink: 0, ...style }}>
            {children}
        </svg>
    );
}

type P = Omit<IconProps, 'children'>;

export const Ic = {
    clock: (p: P = {}) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Icon>,
    pin: (p: P = {}) => <Icon {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></Icon>,
    lock: (p: P = {}) => <Icon {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" /></Icon>,
    check: (p: P = {}) => <Icon {...p}><path d="M4.5 12.5 9.5 17.5 19.5 6.5" /></Icon>,
    x: (p: P = {}) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>,
    alert: (p: P = {}) => <Icon {...p}><path d="M10.3 4.3 2.6 18a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z" /><path d="M12 9.5v4" /><path d="M12 17h.01" /></Icon>,
    bell: (p: P = {}) => <Icon {...p}><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.3 5.5 2 6.2.3.4 0 1-.5 1H5c-.5 0-.8-.6-.5-1 .7-.7 2-2.2 2-6.2Z" /><path d="M10 19.5a2.2 2.2 0 0 0 4 0" /></Icon>,
    chevD: (p: P = {}) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>,
    user: (p: P = {}) => <Icon {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" /></Icon>,
    users: (p: P = {}) => <Icon {...p}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 6a3 3 0 0 1 0 6M17.5 19a5.5 5.5 0 0 0-3-4.9" /></Icon>,
    calendar: (p: P = {}) => <Icon {...p}><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4" /></Icon>,
    edit: (p: P = {}) => <Icon {...p}><path d="M14.5 5.5l4 4M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19l-4 1Z" /></Icon>,
    shield: (p: P = {}) => <Icon {...p}><path d="M12 3.5 19 6v5c0 4.5-3 8-7 9.5C8 19 5 15.5 5 11V6l7-2.5Z" /><path d="M9 12l2 2 4-4" /></Icon>,
    refresh: (p: P = {}) => <Icon {...p}><path d="M20 11a8 8 0 1 0-.7 4" /><path d="M20 5v6h-6" /></Icon>,
    doc: (p: P = {}) => <Icon {...p}><path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" /><path d="M14 3.5v4h4M9 13h6M9 16.5h4" /></Icon>,
    logout: (p: P = {}) => <Icon {...p}><path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" /><path d="M10 12h10M16 7l5 5-5 5" /></Icon>,
    plus: (p: P = {}) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
    trash: (p: P = {}) => <Icon {...p}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" /></Icon>,
    power: (p: P = {}) => <Icon {...p}><path d="M12 4v8M7.5 7a7 7 0 1 0 9 0" /></Icon>,
    settings: (p: P = {}) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18 6l-2 2M8 16l-2 2M18 18l-2-2M8 8 6 6" /></Icon>,
    chart: (p: P = {}) => <Icon {...p}><path d="M4 4v16h16" /><path d="M8 14v3M12 9v8M16 12v5" /></Icon>,
    arrowLeft: (p: P = {}) => <Icon {...p}><path d="M19 12H6M11 6l-5 6 5 6" /></Icon>,
    key: (p: P = {}) => <Icon {...p}><circle cx="8" cy="15" r="4" /><path d="M10.85 12.15 20 3M18 5l2 2M15 8l2 2" /></Icon>,
};
