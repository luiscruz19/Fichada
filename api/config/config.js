import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
    DATABASE: {
        HOST: process.env.DB_HOST || 'localhost',
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_ROOT_PASSWORD || '',
        NAME: process.env.DB_NAME || 'fichada',
        PORT: process.env.DB_PORT || 3306,
        DIALECT: process.env.DB_DIALECT || 'mysql'
    },
    PORT: process.env.API_PORT || 80,
    SECRET_KEY: process.env.SECRET_KEY || 'token',
    AUTH_API_URL: process.env.AUTH_API_URL,
    MAILER_API_URL: process.env.MAILER_API_URL,
    WEB_URL: process.env.WEB_URL,
    AUTHORIZATION: {
        USER: process.env.AUTH_BASIC_USER || 'auth',
        PASSWORD: process.env.AUTH_BASIC_PW || 'secret',
    },
    MAILER_AUTH: {
        USER: process.env.MAILER_BASIC_USER || 'mailer',
        PASSWORD: process.env.MAILER_BASIC_PW || 'secret',
    },
    // Debe existir en auth: lo crea su migración 007.
    ADMIN: {
        EMAIL: process.env.ADMIN_EMAIL || 'admin@fichada.com',
        FIRST_NAME: process.env.ADMIN_FIRST_NAME || 'Admin',
        LAST_NAME: process.env.ADMIN_LAST_NAME || 'Fichada',
    },
};

export default CONFIG;
