import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import adminPermission from '../../middlewares/admin-permission.js';
import admin from './admin.routes.js';

const auditLog = Router();

// Auditoría: solo lectura para administración.
auditLog.use('/admin', [validateToken, adminPermission], admin);

export default auditLog;
