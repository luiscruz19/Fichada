'use client';

import { useState } from 'react';
import { Ic } from './icons';

// Input de contraseña con "ojito" para mostrar/ocultar. Estándar para todo campo de
// password del panel.
export function PasswordInput({
    value, onChange, placeholder, autoFocus, inputStyle, name,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    inputStyle?: React.CSSProperties;
    name?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <input
                type={show ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
                type="button"
                onClick={() => setShow((v) => !v)}
                tabIndex={-1}
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={show ? 'Ocultar' : 'Mostrar'}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            >
                {show ? Ic.eyeOff({ size: 18 }) : Ic.eye({ size: 18 })}
            </button>
        </div>
    );
}
