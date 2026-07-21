export type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role?: 'admin' | 'employee';
    status?: 'active' | 'inactive';
    target_hours?: number | null;
    expected_check_in?: string | null;
    work_days?: string[] | null;
    user_id?: number | null;
    devices?: Device[];
};

export type Device = {
    id: number;
    employee_id: number;
    device_uuid: string;
    platform: string | null;
    status: 'active' | 'revoked';
};

export type Setting = {
    id: number;
    default_target_hours: number | null;
    default_expected_check_in: string | null;
    work_days: string[] | null;
    late_tolerance_minutes: number;
    timezone: string;
    rounding_minutes: number;
    location_required: boolean;
    allow_breaks: boolean;
    allow_correction_requests: boolean;
    reminders_enabled: boolean;
    reminder_checkin_start: number;
    reminder_checkin_end: number;
    reminder_checkout_start: number;
    reminder_checkout_end: number;
};

export type Site = {
    id: number;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    radius_meters: number | null;
    status: 'active' | 'inactive';
};

export type Break = {
    id: number;
    shift_id: number;
    break_start: string;
    break_end: string | null;
    duration_seconds: number | null;
};

export type Shift = {
    id: number;
    employee_id: number;
    check_in: string;
    check_out: string | null;
    check_in_lat: number | null;
    check_in_lng: number | null;
    check_out_lat: number | null;
    check_out_lng: number | null;
    worked_seconds: number | null;
    status: 'open' | 'closed';
    origin: 'mobile' | 'correction';
    employee?: Employee;
    breaks?: Break[];
};

export type CorrectionRequest = {
    id: number;
    employee_id: number;
    shift_id: number | null;
    type: 'edit' | 'add';
    requested_check_in: string | null;
    requested_check_out: string | null;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    employee?: Employee;
};

export type AuditLog = {
    id: number;
    entity: string;
    entity_id: number | null;
    admin_id: number | null;
    action: string;
    old_values: any;
    new_values: any;
    reason: string | null;
    created_at: string;
};

// Fila de la tabla de Historial (derivada de un Shift).
export type Row = {
    shift: Shift;
    emp: string;
    ini: string;
    date: string;
    in: string | null;
    out: string | null;
    pausas: string;
    total: string;
    estado: 'ok' | 'open';
    req?: CorrectionRequest | null;
};
