import { redirect } from 'next/navigation';
import { getToken, apiGetJson } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { EquipoClient } from '@/components/EquipoClient';
import type { Employee } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EquipoPage() {
    if (!getToken()) redirect('/login');
    const res = await apiGetJson<{ data: Employee[] }>('/employees/admin');
    const employees = res?.data || [];

    return (
        <div className="admin">
            <Sidebar />
            <EquipoClient employees={employees} />
        </div>
    );
}
