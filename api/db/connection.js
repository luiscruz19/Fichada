import sequelize from './sequelize.js';
import '../models/index.js';

// En producción sync solo crea tablas nuevas: alter modificaría las existentes.
(async () => {
    try {
        await sequelize.authenticate();
        console.info('Conexión a la base de datos establecida correctamente');

        const isProduction = process.env.NODE_ENV === 'production';
        await sequelize.sync({ alter: !isProduction });

        console.info(
            `Modelos sincronizados (${isProduction ? 'producción: solo crear' : 'desarrollo: alter'})`
        );
    } catch (error) {
        console.error('No se pudo conectar/sincronizar la base de datos:', error.message);
    }
})();
