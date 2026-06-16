export default {
    async up(queryInterface, DataTypes) {
        await queryInterface.createTable('login_logs', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: { type: DataTypes.INTEGER, allowNull: true },
            email: { type: DataTypes.STRING(255), allowNull: false },
            status: { type: DataTypes.STRING(20), allowNull: false },
            ip: { type: DataTypes.STRING(45), allowNull: true },
            forwarded_ip: { type: DataTypes.STRING(255), allowNull: true },
            user_agent: { type: DataTypes.TEXT, allowNull: true },
            origin: { type: DataTypes.STRING(255), allowNull: true },
            accept_language: { type: DataTypes.STRING(100), allowNull: true },
            is_admin: { type: DataTypes.BOOLEAN, allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        });
        await queryInterface.addIndex('login_logs', ['email'], { name: 'idx_login_logs_email' }).catch(() => {});
        await queryInterface.addIndex('login_logs', ['user_id'], { name: 'idx_login_logs_user_id' }).catch(() => {});
        await queryInterface.addIndex('login_logs', ['status'], { name: 'idx_login_logs_status' }).catch(() => {});
        await queryInterface.addIndex('login_logs', ['created_at'], { name: 'idx_login_logs_created_at' }).catch(() => {});
    },
    async down(queryInterface) {
        await queryInterface.dropTable('login_logs');
    },
};
