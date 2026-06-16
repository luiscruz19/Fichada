import sequelize from './sequelize.js';
import '../models/index.js';
import Employee from '../models/Employee.js';
import Setting from '../models/Setting.js';
import CONFIG from '../config/config.js';

/**
 * Seed idempotente: deja el sistema listo para usar.
 *  1. Resuelve el usuario admin contra el servicio auth (por email) para obtener su user_id.
 *  2. Crea/asegura el Employee admin vinculado a ese user_id.
 *  3. Asegura la fila única de ajustes globales con los defaults.
 *
 * Uso (dentro del contenedor): node db/seed.js   ·   o `make seed`.
 */

async function resolveAuthUserId(email) {
    const { AUTH_API_URL, AUTHORIZATION } = CONFIG;
    if (!AUTH_API_URL) throw new Error('AUTH_API_URL no está configurado');

    const basic = Buffer.from(`${AUTHORIZATION.USER}:${AUTHORIZATION.PASSWORD}`).toString('base64');
    const url = `${AUTH_API_URL}/auth/user-by-email/${encodeURIComponent(email)}`;

    const res = await fetch(url, { headers: { Authorization: `Basic ${basic}` } });
    if (!res.ok) {
        throw new Error(`auth respondió ${res.status} al resolver ${email}`);
    }
    const json = await res.json();
    const id = json?.data?.id;
    if (!id) throw new Error(`auth no devolvió el id para ${email}`);
    return id;
}

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        const { ADMIN } = CONFIG;

        // 1 + 2) Employee admin vinculado al user de auth
        const userId = await resolveAuthUserId(ADMIN.EMAIL);
        const [employee, created] = await Employee.findOrCreate({
            where: { email: ADMIN.EMAIL },
            defaults: {
                user_id: userId,
                first_name: ADMIN.FIRST_NAME,
                last_name: ADMIN.LAST_NAME,
                role: 'admin',
                status: 'active',
            },
        });
        if (!created && employee.user_id !== userId) {
            await employee.update({ user_id: userId, role: 'admin', status: 'active' });
        }
        console.info(`✓ Employee admin ${created ? 'creado' : 'asegurado'} (id=${employee.id}, user_id=${userId})`);

        // 3) Ajustes globales (fila única)
        const settings = await Setting.findOne({ order: [['id', 'ASC']] });
        if (!settings) {
            await Setting.create({});
            console.info('✓ Ajustes globales creados con los valores por defecto');
        } else {
            console.info('✓ Ajustes globales ya existían');
        }

        console.info('Seed completado.');
        process.exit(0);
    } catch (error) {
        console.error('Error en el seed:', error.message);
        process.exit(1);
    }
})();
