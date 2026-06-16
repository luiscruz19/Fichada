import { errorMessage, successMessage } from '../utils/messages.js';
import messages from '../config/messages.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import { Normalize } from '../utils/helpers.js';

export const batch = async (req, res) => {
    try {
        const { users } = req.body;
        if (!users || users.length === 0) {
            return res.status(400).json(errorMessage({ message: messages.generic.error }));
        }
        const results = await Promise.all(
            users.map(id =>
                User.findByPk(id).then(data => (data ? Normalize(data) : null))
            )
        );
        return res.status(200).json(successMessage({
            extra: { data: results.filter(u => u !== null) },
        }));
    } catch (error) {
        logger.error('batch_user', { error: error?.message });
        return res.status(400).json(errorMessage({ message: messages.generic.error }));
    }
};

export const remove = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json(errorMessage({ message: messages.generic.id_required }));
        }
        const result = await User.destroy({ where: { id } });
        if (result) {
            return res.status(200).json(successMessage({ message: messages.success.remove }));
        }
        return res.status(404).json(errorMessage({ message: messages.error.remove }));
    } catch (error) {
        logger.error('delete_user', { error: error?.message });
        return res.status(400).json(errorMessage({ message: messages.generic.error }));
    }
};

export const validate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json(errorMessage({ message: messages.generic.id_required }));
        }
        const result = await User.findByPk(id);
        if (!result) {
            return res.status(404).json(errorMessage({ message: messages.generic.user_not_found }));
        }
        const { dataValues: data } = result;
        const update = await User.update({ verified: !data.verified }, { where: { id } });
        if (!update) {
            return res.status(500).json(errorMessage({ message: messages.error.validate_account.error.not_verified }));
        }
        return res.status(200).json(successMessage({
            message: !data.verified ? messages.success.validate_account : messages.success.not_validate_account,
        }));
    } catch (error) {
        logger.error('validate_user', { error: error?.message });
        return res.status(400).json(errorMessage({ message: messages.generic.error }));
    }
};

export const view = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json(errorMessage({ message: messages.generic.id_required }));
        }
        const result = await User.findByPk(id);
        if (!result) {
            return res.status(404).json(errorMessage({ message: messages.generic.user_not_found }));
        }
        const { dataValues: data } = result;
        return res.status(200).json(successMessage({
            extra: { data: { id: data.id, email: data.email, verified: data.verified, is_admin: data.is_admin } },
        }));
    } catch (error) {
        logger.error('view_admin_user', { error: error?.message });
        return res.status(400).json(errorMessage({ message: messages.generic.error }));
    }
};
