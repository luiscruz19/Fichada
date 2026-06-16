import { validationResult } from 'express-validator';
import { errorMessage } from './messages.js';

/**
 * Corre un set de validaciones de express-validator y, si hay errores,
 * responde 400 con el detalle agrupado por campo.
 */
export const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        const errorArray = errors.array();

        const errorsByField = {};
        errorArray.forEach(error => {
            const field = error.param || error.path;
            if (!errorsByField[field]) errorsByField[field] = [];
            errorsByField[field].push(error.msg);
        });

        const errorMessages = Object.entries(errorsByField).map(
            ([field, msgs]) => `${field}: ${msgs.join(', ')}`
        );

        return res.status(400).json(errorMessage({
            message: 'Error de validación en los campos ingresados',
            extra: {
                details: errorMessages.join(' | '),
                errors: errorArray.map(err => ({
                    field: err.param || err.path,
                    message: err.msg,
                    value: err.value
                })),
                validation: errorsByField
            }
        }));
    };
};

export const isEmpty = (value) =>
    (value === null || value === undefined || value === '');
