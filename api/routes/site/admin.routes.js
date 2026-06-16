import { Router } from 'express';
import {
    listSites,
    getSite,
    createSite,
    updateSite,
    deleteSite
} from '../../controllers/site/admin.controllers.js';
import {
    createSiteValidation,
    updateSiteValidation,
    idParamValidation
} from '../../validations/site.validation.js';
import { validate } from '../../utils/helpers.js';

const admin = Router();

admin.get('/', listSites);
admin.get('/:id', validate(idParamValidation), getSite);
admin.post('/', validate(createSiteValidation), createSite);
admin.put('/:id', validate(updateSiteValidation), updateSite);
admin.delete('/:id', validate(idParamValidation), deleteSite);

export default admin;
