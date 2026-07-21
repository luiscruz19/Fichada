'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/lib/config';
import { PasswordInput } from '@/components/PasswordInput';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${BASE_PATH}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const json = await res.json();
            if (!json.ok) {
                setError(json.message || 'No se pudo iniciar sesión');
                return;
            }
            router.replace('/historial');
            router.refresh();
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'radial-gradient(120% 120% at 50% 0%, #2a2c30 0%, #1b1d20 100%)' }}>
            <form onSubmit={onSubmit} style={{ width: 380, background: 'var(--surface)', borderRadius: 20, padding: '32px 30px', boxShadow: 'var(--shadow-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22 }}>
                    <img src={`${BASE_PATH}/logo.svg`} width={42} height={42} alt="Fichada" style={{ borderRadius: 12, display: 'block' }} />
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Fichada</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Panel de administración</div>
                    </div>
                </div>

                <label className="eyebrow">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
                    style={inputStyle} placeholder="admin@fichada.com" />

                <label className="eyebrow" style={{ marginTop: 14, display: 'block' }}>Contraseña</label>
                <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" inputStyle={inputStyle} />

                {error && (
                    <div style={{ marginTop: 14, background: 'var(--danger-tint)', color: 'var(--danger)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary"
                    style={{ width: '100%', height: 46, marginTop: 20, justifyContent: 'center', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Ingresando…' : 'Ingresar'}
                </button>
            </form>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', height: 46, marginTop: 6, borderRadius: 10, border: '1.5px solid var(--hairline-2)',
    background: 'var(--surface)', padding: '0 12px', fontSize: 15, color: 'var(--ink)', outline: 'none',
};
