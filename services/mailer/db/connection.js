import { logger } from '../utils/logger.js';

const ENABLE_EMAIL_LOG = process.env.ENABLE_EMAIL_LOG === 'true';

if (ENABLE_EMAIL_LOG) {
    const { default: sequelize } = await import('./sequelize.js');
    await import('../models/EmailLog.js');

    try {
        await sequelize.authenticate();
        logger.info('[db] Conexión a base de datos establecida.');
        const { default: autoRun } = await import('./migrations/auto-run.js');
        await autoRun();
    } catch (error) {
        logger.error('[db] Error al conectar con la base de datos:', error);
    }
} else {
    logger.info('[db] ENABLE_EMAIL_LOG desactivado — base de datos no inicializada.');
}
