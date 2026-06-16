import { redirect } from 'next/navigation';
import { getToken } from '@/lib/api';

export default function Home() {
    redirect(getToken() ? '/historial' : '/login');
}
