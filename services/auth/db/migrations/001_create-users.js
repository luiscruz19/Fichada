export default {
    async up(queryInterface, DataTypes) {
        await queryInterface.createTable('users', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
            password: { type: DataTypes.STRING(255), allowNull: true },
            verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            remember_token: { type: DataTypes.STRING(255), allowNull: true },
            contact_email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
            is_guest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            previous_password: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
            totp_secret: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
            totp_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            is_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        });
        await queryInterface.addIndex('users', ['email'], { name: 'idx_users_email', unique: true });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('users');
    },
};
