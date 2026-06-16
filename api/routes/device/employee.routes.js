import { Router } from 'express';
import {
    registerDevice,
    updatePushToken,
    getMyDevice
} from '../../controllers/device/employee.controllers.js';
import {
    registerDeviceValidation,
    updatePushTokenValidation
} from '../../validations/device.validation.js';
import { validate } from '../../utils/helpers.js';

const employee = Router();

employee.get('/me', getMyDevice);
employee.post('/register', validate(registerDeviceValidation), registerDevice);
employee.patch('/push-token', validate(updatePushTokenValidation), updatePushToken);

export default employee;
