const messages = {
    generic: {
        fields_required: 'Todos los campos requeridos deben ser completados',
        invalid_status: 'El estado proporcionado no es válido',
        invalid_enum_value: 'El valor proporcionado no está permitido',
        id_required: 'El ID es requerido',
        invalid_date_format: 'Formato de fecha inválido',
        fields_empty: 'Campos vacíos',
        token_expirated: 'El token ingresado ha expirado.',
        token_invalid: 'El token ingresado no es válido.',
        token_not_found: 'El token ingresado no fue encontrado.',
        credential_invalid: 'Credenciales inválidas.',
        autorization_required: 'Autorización requerida.',
    },
    error: {
        general: {
            email_exists: 'Ya existe un empleado con este email',
            device_exists: 'Este dispositivo ya está vinculado',
        },

        employee: {
            fields_empty: {
                first_name: 'El nombre no puede estar vacío',
                last_name: 'El apellido no puede estar vacío',
                email: 'El email no puede estar vacío',
                role: 'El rol no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },

        shift: {
            fields_empty: {
                employee_id: 'El empleado no puede estar vacío',
                check_in: 'La hora de entrada no puede estar vacía',
                check_in_lat: 'La latitud de entrada no puede estar vacía',
                check_in_lng: 'La longitud de entrada no puede estar vacía',
                status: 'El estado no puede estar vacío',
                origin: 'El origen no puede estar vacío',
            }
        },

        break: {
            fields_empty: {
                shift_id: 'La jornada no puede estar vacía',
                break_start: 'El inicio de la pausa no puede estar vacío',
            }
        },

        correction_request: {
            fields_empty: {
                employee_id: 'El empleado no puede estar vacío',
                reason: 'El motivo no puede estar vacío',
                type: 'El tipo no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },

        audit_log: {
            fields_empty: {
                entity: 'La entidad no puede estar vacía',
                action: 'La acción no puede estar vacía',
            }
        },

        site: {
            fields_empty: {
                name: 'El nombre no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },

        device: {
            fields_empty: {
                employee_id: 'El empleado no puede estar vacío',
                device_uuid: 'El identificador del dispositivo no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },

        notification: {
            fields_empty: {
                employee_id: 'El empleado no puede estar vacío',
                type: 'El tipo de notificación no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },
    },
};

export default messages;
