import { redirect } from 'next/navigation';
import { getToken, apiGetJson } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { AjustesClient } from '@/components/AjustesClient';
import type { Setting, Site } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
    if (!getToken()) redirect('/login');
    const sJson = await apiGetJson<{ data: Setting }>('/settings/admin');
    const siteJson = await apiGetJson<{ data: Site[] }>('/sites/admin');

    return (
        <div className="admin">
            <Sidebar />
            <AjustesClient settings={sJson?.data || null} sites={siteJson?.data || []} />
        </div>
    );
}
