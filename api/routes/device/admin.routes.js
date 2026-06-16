import { Router } from 'express';
import {
    listDevices,
    revokeDevice,
    reactivateDevice
} from '../../controllers/device/admin.controllers.js';
import { idParamValidation } from '../../validations/device.validation.js';
import { validate } from '../../utils/helpers.js';

const admin = Router();

admin.get('/', listDevices);
admin.post('/:id/revoke', validate(idParamValidation), revokeDevice);
admin.post('/:id/reactivate', validate(idParamValidation), reactivateDevice);

export default admin;
