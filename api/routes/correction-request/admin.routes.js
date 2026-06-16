import { Router } from 'express';
import { listRequests, approveRequest, rejectRequest } from '../../controllers/correction-request/admin.controllers.js';
import { resolveValidation } from '../../validations/correction-request.validation.js';
import { validate } from '../../utils/helpers.js';

const admin = Router();

admin.get('/', listRequests);
admin.post('/:id/approve', validate(resolveValidation), approveRequest);
admin.post('/:id/reject', validate(resolveValidation), rejectRequest);

export default admin;
