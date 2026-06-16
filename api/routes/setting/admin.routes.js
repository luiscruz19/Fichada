import { Router } from 'express';
import { getSettings, updateSettings } from '../../controllers/setting/admin.controllers.js';
import { updateSettingsValidation } from '../../validations/setting.validation.js';
import { validate } from '../../utils/helpers.js';

const admin = Router();

admin.get('/', getSettings);
admin.put('/', validate(updateSettingsValidation), updateSettings);

export default admin;
