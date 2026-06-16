import { redirect } from 'next/navigation';
import { getToken, apiGetJson, getAdminName } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { HistorialClient } from '@/components/HistorialClient';
import { fmtTime, fmtDateShort, secondsToHHMM, initials } from '@/lib/format';
import { BASE_PATH } from '@/lib/config';
import type { Shift, CorrectionRequest, Row } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HistorialPage() {
    if (!getToken()) redirect('/login');

    const shiftsJson = await apiGetJson<{ data: Shift[] }>('/shifts/admin');
    const reqJson = await apiGetJson<{ data: CorrectionRequest[] }>('/correction-requests/admin?status=pending');

    const shifts = shiftsJson?.data || [];
    const pending = reqJson?.data || [];

    const reqByShift = new Map<number, CorrectionRequest>();
    pending.forEach((r) => { if (r.shift_id) reqByShift.set(r.shift_id, r); });

    const rows: Row[] = shifts.map((s) => {
        const emp = s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : `#${s.employee_id}`;
        const pausasSec = (s.breaks || []).reduce((a, b) => a + (b.duration_seconds || 0), 0);
        return {
            shift: s,
            emp,
            ini: initials(emp),
            date: fmtDateShort(s.check_in),
            in: fmtTime(s.check_in),
            out: fmtTime(s.check_out),
            pausas: pausasSec ? secondsToHHMM(pausasSec) : '—',
            total: secondsToHHMM(s.worked_seconds),
            estado: s.status === 'open' ? 'open' : 'ok',
            req: reqByShift.get(s.id) || null,
        };
    });

    const counts = { open: rows.filter((r) => r.estado === 'open').length, req: pending.length };

    return (
        <div className="admin">
            <Sidebar adminName={await getAdminName()} />
            <HistorialClient rows={rows} counts={counts} exportBase={`${BASE_PATH}/api/export`} />
        </div>
    );
}
