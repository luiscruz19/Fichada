import sequelize from '../db/sequelize.js';

import Employee from './Employee.js';
import Shift from './Shift.js';
import Break from './Break.js';
import CorrectionRequest from './CorrectionRequest.js';
import AuditLog from './AuditLog.js';
import Site from './Site.js';
import Setting from './Setting.js';
import Device from './Device.js';
import Notification from './Notification.js';

/**
 * Asociaciones.
 * Se usan FK lógicas (constraints:false): la relación existe para los includes/queries
 * pero no se crea una FK física en la base, igual que en el resto de los proyectos.
 * Evita conflictos de sync con paranoid (soft-delete) y orden de creación de tablas.
 */

// Empleado ─< Jornadas
Employee.hasMany(Shift, { foreignKey: 'employee_id', as: 'shifts', constraints: false });
Shift.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

// Jornada ─< Pausas
Shift.hasMany(Break, { foreignKey: 'shift_id', as: 'breaks', constraints: false });
Break.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift', constraints: false });

// Empleado ─< Solicitudes de corrección
Employee.hasMany(CorrectionRequest, { foreignKey: 'employee_id', as: 'correctionRequests', constraints: false });
CorrectionRequest.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

// Jornada ─< Solicitudes de corrección (shift_id puede ser NULL en altas de jornada faltante)
Shift.hasMany(CorrectionRequest, { foreignKey: 'shift_id', as: 'correctionRequests', constraints: false });
CorrectionRequest.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift', constraints: false });

// Empleado ─< Dispositivos
Employee.hasMany(Device, { foreignKey: 'employee_id', as: 'devices', constraints: false });
Device.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

// Empleado ─< Notificaciones
Employee.hasMany(Notification, { foreignKey: 'employee_id', as: 'notifications', constraints: false });
Notification.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

// AuditLog, Site y Setting no llevan asociación formal:
//  - AuditLog es polimórfico (entity + entity_id) y append-only.
//  - Site es un catálogo de referencia (sin empleados asignados en el MVP).
//  - Setting es fila única de configuración global.

export {
    sequelize,
    Employee,
    Shift,
    Break,
    CorrectionRequest,
    AuditLog,
    Site,
    Setting,
    Device,
    Notification,
};

export default {
    sequelize,
    Employee,
    Shift,
    Break,
    CorrectionRequest,
    AuditLog,
    Site,
    Setting,
    Device,
    Notification,
};
