import { redirect } from 'next/navigation';
import { getToken, apiGetJson, getAdminName } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { MapaClient, type MapPoint } from '@/components/MapaClient';
import { TZ } from '@/lib/metrics';
import type { Shift } from '@/lib/types';

export const dynamic = 'force-dynamic';

function fmtAR(iso: string): string {
    return new Intl.DateTimeFormat('es-AR', {
        timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
}

export default async function MapaPage() {
    if (!getToken()) redirect('/login');
    const res = await apiGetJson<{ data: Shift[] }>('/shifts/admin');
    const shifts = res?.data || [];

    const points: MapPoint[] = [];
    for (const s of shifts) {
        const name = s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : `#${s.employee_id}`;
        if (s.check_in_lat != null && s.check_in_lng != null) {
            points.push({ lat: Number(s.check_in_lat), lng: Number(s.check_in_lng), kind: 'in', name, time: fmtAR(s.check_in), shiftId: s.id });
        }
        if (s.check_out && s.check_out_lat != null && s.check_out_lng != null) {
            points.push({ lat: Number(s.check_out_lat), lng: Number(s.check_out_lng), kind: 'out', name, time: fmtAR(s.check_out), shiftId: s.id });
        }
    }

    return (
        <div className="admin">
            <Sidebar adminName={await getAdminName()} />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
                <div style={{ padding: '20px 28px 14px' }}>
                    <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Mapa de fichadas</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-3)' }}>Ubicación de cada entrada y salida registrada por GPS</p>
                </div>
                <div style={{ flex: 1, padding: '0 28px 24px', minHeight: 0 }}>
                    <MapaClient points={points} />
                </div>
            </main>
        </div>
    );
}
