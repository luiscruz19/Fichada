import sequelize from './sequelize.js';
import addMissingColumns from './add-missing-columns.js';
import '../models/index.js';

// En producción sync solo crea tablas nuevas: alter modificaría las existentes.
const isProduction = process.env.NODE_ENV === 'production';

try {
    await sequelize.authenticate();
    console.info('Conexión a la base de datos establecida correctamente');

    await sequelize.sync({ alter: !isProduction });
    await addMissingColumns();

    console.info(`Modelos sincronizados (${isProduction ? 'producción: solo crear' : 'desarrollo: alter'})`);
} catch (error) {
    console.error('No se pudo conectar/sincronizar la base de datos:', error.message);
}
