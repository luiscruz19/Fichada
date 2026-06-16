import { Router } from 'express';
import { listAuditLogs, getAuditLog } from '../../controllers/audit-log/admin.controllers.js';

const admin = Router();

admin.get('/', listAuditLogs);
admin.get('/:id', getAuditLog);

export default admin;
