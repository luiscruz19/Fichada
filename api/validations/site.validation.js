import { body, param } from 'express-validator';

export const createSiteValidation = [
    body('name').notEmpty().withMessage('El nombre de la sede es obligatorio'),
    body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('La latitud no es válida'),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('La longitud no es válida'),
    body('radius_meters').optional().isInt({ min: 0 }).withMessage('El radio debe ser un entero positivo'),
];

export const updateSiteValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('La latitud no es válida'),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('La longitud no es válida'),
    body('radius_meters').optional().isInt({ min: 0 }).withMessage('El radio debe ser un entero positivo'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Estado no válido'),
];

export const idParamValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
];
