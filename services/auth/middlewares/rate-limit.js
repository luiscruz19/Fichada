import rateLimit from 'express-rate-limit';

const limiter = (max, message) => rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    message: { status: 0, message },
    standardHeaders: true,
    legacyHeaders: false,
});

export const signupLimit = limiter(5, 'Demasiados registros. Intentá nuevamente en 15 minutos.');
export const forgotPasswordLimit = limiter(3, 'Demasiadas solicitudes. Intentá nuevamente en 15 minutos.');
export const totpLimit = limiter(10, 'Demasiados intentos. Esperá 15 minutos.');
