'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ic } from './icons';
import { Avatar } from './ui';
import { BASE_PATH } from '@/lib/config';

const ITEMS: [string, string, (p?: any) => JSX.Element][] = [
    ['Historial', '/historial', Ic.calendar],
    ['Reportes', '/reportes', Ic.chart],
    ['Equipo', '/equipo', Ic.users],
    ['Ajustes', '/ajustes', Ic.settings],
];

export function Sidebar({ adminName = 'Administrador' }: { adminName?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    async function logout() {
        await fetch(`${BASE_PATH}/api/logout`, { method: 'POST' });
        router.replace('/login');
        router.refresh();
    }

    return (
        <aside style={{ width: 226, background: 'var(--surface-2)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', padding: '18px 14px', flexShrink: 0, minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 18px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', color: 'var(--on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17 }}>F</div>
                <div>
                    <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em' }}>Fichada</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Panel admin</div>
                </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {ITEMS.map(([label, href, icon]) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link key={href} href={href} className={'nav-item' + (active ? ' active' : '')}>
                            {icon({ size: 19 })}{label}
                        </Link>
                    );
                })}
            </nav>
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--hairline)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar ini={adminName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Administrador</div>
                </div>
                <button onClick={logout} title="Cerrar sesión" style={{ color: 'var(--ink-3)', padding: 4 }}>{Ic.logout({ size: 18 })}</button>
            </div>
        </aside>
    );
}
