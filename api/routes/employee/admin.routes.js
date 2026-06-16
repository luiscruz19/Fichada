import { Router } from 'express';
import {
    listEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    killSwitch,
    resetPin,
    regenerateAccess
} from '../../controllers/employee/admin.controllers.js';
import {
    createEmployeeValidation,
    updateEmployeeValidation,
    idParamValidation
} from '../../validations/employee.validation.js';
import { validate } from '../../utils/helpers.js';

const admin = Router();

admin.get('/', listEmployees);
admin.get('/:id', validate(idParamValidation), getEmployee);
admin.post('/', validate(createEmployeeValidation), createEmployee);
admin.put('/:id', validate(updateEmployeeValidation), updateEmployee);
admin.patch('/:id/deactivate', validate(idParamValidation), deactivateEmployee);
admin.patch('/:id/reactivate', validate(idParamValidation), reactivateEmployee);
admin.post('/:id/kill-switch', validate(idParamValidation), killSwitch);
admin.post('/:id/reset-pin', validate(idParamValidation), resetPin);
admin.post('/:id/reset-access', validate(idParamValidation), regenerateAccess);

export default admin;
