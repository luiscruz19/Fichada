import { Router } from 'express';
import { batch, validate, view, remove } from '../../controllers/admin.js';
import validateToken from '../../middlewares/validate-token.js';
import requireAdmin from '../../middlewares/admin.js';

const api = Router();

api.post('/batch', [validateToken, requireAdmin], batch);
api.put('/validate-user/:id', [validateToken, requireAdmin], validate);
api.get('/users/:id', [validateToken, requireAdmin], view);
api.delete('/users/:id', [validateToken, requireAdmin], remove);

export default api;
