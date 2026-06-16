import { body, param } from 'express-validator';

// La ubicación es obligatoria al fichar (sin GPS no se ficha).
export const clockInValidation = [
    body('lat').notEmpty().withMessage('La latitud es obligatoria').bail()
        .isFloat({ min: -90, max: 90 }).withMessage('La latitud no es válida'),
    body('lng').notEmpty().withMessage('La longitud es obligatoria').bail()
        .isFloat({ min: -180, max: 180 }).withMessage('La longitud no es válida'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('La precisión debe ser un número'),
];

export const clockOutValidation = [
    body('lat').notEmpty().withMessage('La latitud es obligatoria').bail()
        .isFloat({ min: -90, max: 90 }).withMessage('La latitud no es válida'),
    body('lng').notEmpty().withMessage('La longitud es obligatoria').bail()
        .isFloat({ min: -180, max: 180 }).withMessage('La longitud no es válida'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('La precisión debe ser un número'),
];

export const getShiftValidation = [
    param('id').notEmpty().withMessage('El ID de la jornada es obligatorio').bail()
        .isInt().withMessage('El ID debe ser un número entero'),
];
