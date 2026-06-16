import { Router } from 'express';
import authProxy from './auth/index.js';
import shifts from './shift/index.js';
import employees from './employee/index.js';
import correctionRequests from './correction-request/index.js';
import auditLogs from './audit-log/index.js';
import sites from './site/index.js';
import settings from './setting/index.js';
import devices from './device/index.js';
import notifications from './notification/index.js';

const api = Router();

api.get('/', (req, res) => res.json({ status: 1, service: 'fichada-api' }));

api.use('/auth', authProxy);
api.use('/shifts', shifts);
api.use('/employees', employees);
api.use('/correction-requests', correctionRequests);
api.use('/audit-logs', auditLogs);
api.use('/sites', sites);
api.use('/settings', settings);
api.use('/devices', devices);
api.use('/notifications', notifications);

export default api;
