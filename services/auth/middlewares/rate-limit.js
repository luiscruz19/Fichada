import rateLimit from 'express-rate-limit';

export const signupLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { status: 0, message: 'Demasiados registros. Intentá nuevamente en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const forgotPasswordLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { status: 0, message: 'Demasiadas solicitudes. Intentá nuevamente en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const totpLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: 0, message: 'Demasiados intentos. Esperá 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});
