import { Router } from 'express';
import { createRequest, listMyRequests } from '../../controllers/correction-request/employee.controllers.js';
import { createRequestValidation } from '../../validations/correction-request.validation.js';
import { validate } from '../../utils/helpers.js';

const employee = Router();

employee.get('/', listMyRequests);
employee.post('/', validate(createRequestValidation), createRequest);

export default employee;
