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

// FK lógicas (constraints:false): evitan conflictos de sync con paranoid y con el orden de creación de tablas.
Employee.hasMany(Shift, { foreignKey: 'employee_id', as: 'shifts', constraints: false });
Shift.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

Shift.hasMany(Break, { foreignKey: 'shift_id', as: 'breaks', constraints: false });
Break.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift', constraints: false });

Employee.hasMany(CorrectionRequest, { foreignKey: 'employee_id', as: 'correctionRequests', constraints: false });
CorrectionRequest.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

// shift_id es NULL en las altas de jornada faltante (type 'add').
Shift.hasMany(CorrectionRequest, { foreignKey: 'shift_id', as: 'correctionRequests', constraints: false });
CorrectionRequest.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift', constraints: false });

Employee.hasMany(Device, { foreignKey: 'employee_id', as: 'devices', constraints: false });
Device.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

Employee.hasMany(Notification, { foreignKey: 'employee_id', as: 'notifications', constraints: false });
Notification.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });

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

