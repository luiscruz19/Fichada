import bcrypt from 'bcryptjs';

// Only runs if ADMIN_EMAIL is defined — safe to skip in projects that don't need a seeded admin
export default {
    async up(queryInterface) {
        const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE } = process.env;

        if (!ADMIN_EMAIL) {
            return;
        }

        const password = ADMIN_PASSWORD || 'ChangeMe123!';
        const nombre = ADMIN_NOMBRE || 'Administrador';

        const [existing] = await queryInterface.sequelize.query(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            { replacements: [ADMIN_EMAIL] }
        );

        if (existing.length > 0) {
            // Update is_admin flag in case the user exists but is not admin yet
            await queryInterface.sequelize.query(
                'UPDATE users SET is_admin = 1 WHERE email = ?',
                { replacements: [ADMIN_EMAIL] }
            );
            return;
        }

        const hashed = await bcrypt.hash(password, 12);
        const uuid = Array.from({ length: 100 }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
        ).join('');

        await queryInterface.bulkInsert('users', [{
            email: ADMIN_EMAIL,
            password: hashed,
            verified: true,
            remember_token: uuid,
            is_admin: true,
            is_guest: false,
            totp_enabled: false,
            created_at: new Date(),
            updated_at: new Date(),
        }]);

    },
    async down(queryInterface) {
        const { ADMIN_EMAIL } = process.env;
        if (ADMIN_EMAIL) {
            await queryInterface.bulkDelete('users', { email: ADMIN_EMAIL });
        }
    },
};
