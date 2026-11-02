import bcrypt from 'bcryptjs';
import Employee from '../../models/Employee.js';
import CONFIG from '../../config/config.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import { basicAuth } from '../../utils/basic-auth.js';

const { AUTH_API_URL, AUTHORIZATION, SECRET_KEY } = CONFIG;
const authBasic = basicAuth(AUTHORIZATION);

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;
const BCRYPT_ROUNDS = 10;

async function generateAuthToken(userId) {
    if (!userId) return null;
    try {
        const res = await fetch(`${AUTH_API_URL}/generate-token?user_id=${encodeURIComponent(userId)}`, {
            headers: { Authorization: authBasic, token: SECRET_KEY },
        });
        const json = await res.json().catch(() => null);
        return json?.user?.token || null;
    } catch {
        return null;
    }
}

export async function setPin(req, res) {
    try {
        const pin = String(req.body?.pin || '');
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json(errorMessage({ message: 'El PIN debe tener 4 dígitos' }));
        }
        const hash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
        await req.employee.update({ pin_hash: hash, pin_attempts: 0, pin_locked_until: null });
        return res.status(200).json(successMessage({ message: 'PIN configurado' }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'No se pudo configurar el PIN', extra: { error: error.message } }));
    }
}

export async function hasPin(req, res) {
    try {
        const email = String(req.query?.email || '').toLowerCase().trim();
        const employee = await Employee.findOne({ where: { email, status: 'active' }, attributes: ['id', 'pin_hash'] });
        return res.status(200).json(successMessage({ extra: { has_pin: !!employee?.pin_hash } }));
    } catch {
        return res.status(200).json(successMessage({ extra: { has_pin: false } }));
    }
}

export async function loginPin(req, res) {
    try {
        const email = String(req.body?.email || '').toLowerCase().trim();
        const pin = String(req.body?.pin || '');

        const employee = await Employee.findOne({ where: { email, status: 'active' } });
        if (!employee?.pin_hash) {
            return res.status(401).json(errorMessage({ message: 'Credenciales inválidas' }));
        }
        if (employee.pin_locked_until && new Date(employee.pin_locked_until) > new Date()) {
            return res.status(429).json(errorMessage({ message: 'Demasiados intentos. Esperá unos minutos.' }));
        }

        const pinMatches = await bcrypt.compare(pin, employee.pin_hash);
        if (!pinMatches) {
            const attempts = (employee.pin_attempts || 0) + 1;
            const updates = { pin_attempts: attempts };
            if (attempts >= MAX_ATTEMPTS) {
                updates.pin_attempts = 0;
                updates.pin_locked_until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            }
            await employee.update(updates);
            return res.status(401).json(errorMessage({ message: 'PIN incorrecto' }));
        }

        await employee.update({ pin_attempts: 0, pin_locked_until: null });
        const token = await generateAuthToken(employee.user_id);
        if (!token) {
            return res.status(502).json(errorMessage({ message: 'No se pudo iniciar sesión' }));
        }
        return res.status(200).json(successMessage({ extra: { user: { id: employee.user_id, token } } }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'Error al iniciar sesión con PIN', extra: { error: error.message } }));
    }
}
