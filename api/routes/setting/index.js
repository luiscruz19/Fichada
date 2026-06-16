import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import adminPermission from '../../middlewares/admin-permission.js';
import admin from './admin.routes.js';

const setting = Router();

// Ajustes globales: solo administración.
setting.use('/admin', [validateToken, adminPermission], admin);

export default setting;
