import { Router } from 'express';
import { getMyProfile } from '../../controllers/employee/employee.controllers.js';

const employee = Router();

employee.get('/me', getMyProfile);

export default employee;
