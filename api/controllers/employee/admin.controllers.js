import { Op } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Employee from '../../models/Employee.js';
import Device from '../../models/Device.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import inviteEmployee from '../../services/employee/invite.js';
import resetAccess from '../../services/employee/reset-access.js';

const SAFE_ATTRS = { exclude: [] };

// ==================== LISTAR EMPLEADOS ====================
export async function listEmployees(req, res) {
    try {
        const { status, role, search } = req.query;
        const where = {};
        if (status) where.status = status;
        if (role) where.role = role;
        if (search && search.trim()) {
            const q = `%${search.trim()}%`;
            where[Op.or] = [
                { first_name: { [Op.like]: q } },
                { last_name: { [Op.like]: q } },
                { email: { [Op.like]: q } },
            ];
        }

        const employees = await Employee.findAll({ where, order: [['last_name', 'ASC']] });
        return res.status(200).json(successMessage({ extra: { data: employees } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar los empleados', extra: { error: error.message }
        }));
    }
}

// ==================== OBTENER EMPLEADO ====================
export async function getEmployee(req, res) {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [{ model: Device, as: 'devices' }],
        });
        if (!employee) return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));
        return res.status(200).json(successMessage({ extra: { data: employee } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el empleado', extra: { error: error.message }
        }));
    }
}

// ==================== CREAR / INVITAR EMPLEADO ====================
// Crea el registro de dominio + el acceso real en auth (usuario verificado) y envía la
// invitación por mailer. Vincula employee.user_id. Devuelve la contraseña temporal para
// que el admin la comparta si el mail no se pudo enviar (p.ej. sin SMTP en dev).
export async function createEmployee(req, res) {
    try {
        const { first_name, last_name, email, role, expected_check_in, target_hours, work_days } = req.body;

        const exists = await Employee.findOne({ where: { email } });
        if (exists) {
            return res.status(409).json(errorMessage({ message: 'Ya existe un empleado con este email' }));
        }

        // Crea el acceso en auth (signup + verificación) y manda la invitación.
        let invite;
        try {
            invite = await inviteEmployee({ first_name, last_name, email });
        } catch (e) {
            return res.status(502).json(errorMessage({
                message: e.message || 'No se pudo crear el acceso del empleado',
            }));
        }

        const employee = await Employee.create({
            user_id: invite.userId,
            first_name,
            last_name,
            email,
            role: role || 'employee',
            expected_check_in: expected_check_in ?? null,
            target_hours: target_hours ?? null,
            work_days: work_days ?? null,
            status: 'active',
            created_by: req.employee?.id ?? null,
        });

        return res.status(201).json(successMessage({
            message: 'Empleado creado e invitado',
            extra: { data: employee, temp_password: invite.tempPassword, email_sent: invite.emailSent },
        }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al crear el empleado', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR EMPLEADO ====================
export async function updateEmployee(req, res) {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));

        const fields = ['first_name', 'last_name', 'email', 'role', 'expected_check_in', 'target_hours', 'work_days'];
        const updates = {};
        for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];

        await employee.update(updates);
        return res.status(200).json(successMessage({ message: 'Empleado actualizado', extra: { data: employee } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar el empleado', extra: { error: error.message }
        }));
    }
}

// ==================== DAR DE BAJA ====================
export async function deactivateEmployee(req, res) {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));
        await employee.update({ status: 'inactive' });
        return res.status(200).json(successMessage({ message: 'Empleado dado de baja', extra: { data: employee } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al dar de baja al empleado', extra: { error: error.message }
        }));
    }
}

// ==================== REACTIVAR ====================
export async function reactivateEmployee(req, res) {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));
        await employee.update({ status: 'active' });
        return res.status(200).json(successMessage({ message: 'Empleado reactivado', extra: { data: employee } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al reactivar el empleado', extra: { error: error.message }
        }));
    }
}

// ==================== REGENERAR ACCESO (nueva contraseña temporal) ====================
// Para cuando se perdió la contraseña temporal. Genera una nueva en auth y resetea el PIN:
// el empleado entra con la nueva contraseña y configura un PIN nuevo.
export async function regenerateAccess(req, res) {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));
        if (!employee.user_id) return res.status(400).json(errorMessage({ message: 'El empleado no tiene cuenta de acceso' }));

        const tempPassword = await resetAccess(employee.user_id);
        await employee.update({ pin_hash: null, pin_attempts: 0, pin_locked_until: null });

        return res.status(200).json(successMessage({
            message: 'Acceso regenerado',
            extra: { temp_password: tempPassword },
        }));
    } catch (error) {
        return res.status(502).json(errorMessage({ message: error.message || 'No se pudo regenerar el acceso' }));
    }
}

// ==================== RESETEAR PIN ====================
// Borra el PIN del empleado: en el próximo ingreso vuelve a entrar con su contraseña
// y configura un PIN nuevo.
export async function resetPin(req, res) {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));
        await employee.update({ pin_hash: null, pin_attempts: 0, pin_locked_until: null });
        return res.status(200).json(successMessage({ message: 'PIN reseteado' }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'Error al resetear el PIN', extra: { error: error.message } }));
    }
}

// ==================== KILL SWITCH (revocar sesión/dispositivos) ====================
export async function killSwitch(req, res) {
    const transaction = await sequelize.transaction();
    try {
        const employee = await Employee.findByPk(req.params.id, { transaction });
        if (!employee) {
            await transaction.rollback();
            return res.status(404).json(errorMessage({ message: 'Empleado no encontrado' }));
        }

        const [count] = await Device.update(
            { status: 'revoked', revoked_at: new Date(), revoked_by: req.employee?.id ?? null },
            { where: { employee_id: employee.id, status: 'active' }, transaction }
        );

        await transaction.commit();
        return res.status(200).json(successMessage({
            message: 'Sesión revocada: el empleado deberá volver a iniciar sesión',
            extra: { data: { revoked_devices: count } }
        }));
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json(errorMessage({
            message: 'Error al revocar la sesión', extra: { error: error.message }
        }));
    }
}
