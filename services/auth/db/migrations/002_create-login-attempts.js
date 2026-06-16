export default {
    async up(queryInterface, DataTypes) {
        await queryInterface.createTable('login_attempts', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            email: { type: DataTypes.STRING(255), allowNull: false },
            ip: { type: DataTypes.STRING(45), allowNull: false },
            count: { type: DataTypes.INTEGER, defaultValue: 0 },
            blocked_until: { type: DataTypes.BIGINT, defaultValue: 0 },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        });
        await queryInterface.addIndex('login_attempts', ['email', 'ip'], { name: 'idx_login_attempts_email_ip' }).catch(() => {});
    },
    async down(queryInterface) {
        await queryInterface.dropTable('login_attempts');
    },
};
