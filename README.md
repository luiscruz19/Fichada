# Fichada

Sistema de control de asistencia. El empleado ficha entrada, salida y pausas desde una app Android, con su ubicación. El administrador revisa jornadas, resuelve correcciones y exporta reportes desde un panel web.

**Distribución:** no está en Play Store ni en App Store. La app se entrega como APK de distribución interna (EAS) y se actualiza por OTA con `expo-updates`.

## Qué hace

**App del empleado**

- Primer ingreso con contraseña temporal; después, PIN de 4 dígitos o biometría.
- Fichada de entrada y salida con latitud y longitud obligatorias. Sin permiso de ubicación no se ficha.
- Pausas, historial propio y solicitudes de corrección de una jornada.
- Recordatorios push de entrada y salida (solo en builds EAS: Expo Go no recibe push en Android).

**Panel de administración** (`/backoffice`)

- Historial de jornadas y aprobación o rechazo de correcciones.
- Reportes por período y por persona; exportación a CSV, Excel y PDF.
- Mapa de fichadas, con pines o por densidad.
- Equipo: alta con invitación por mail, baja, regeneración de acceso y reseteo de PIN.
- Ajustes globales y catálogo de sedes.

## Reglas del negocio

- La hora de cada marca la pone el servidor, no el teléfono. Todo el sistema opera en hora de Argentina (UTC−3 fijo).
- Un empleado tiene una sola jornada abierta, y no puede cerrarla con una pausa en curso.
- El administrador no edita jornadas de oficio: todo cambio nace de una solicitud del empleado y queda en la auditoría con el valor anterior y el nuevo. Puede aprobar con una hora distinta a la pedida.
- Una cuenta tiene un dispositivo activo. Un teléfono nuevo reemplaza al anterior después de un login válido; un dispositivo vinculado a otra cuenta recibe 409.
- Cinco intentos fallidos de PIN bloquean el ingreso por PIN durante 5 minutos.
- Un job corre cada 30 minutos y avisa en días laborales: entrada si no fichó (9 a 13 h por defecto), salida si la jornada sigue abierta (18 a 20 h por defecto). Las franjas se configuran en Ajustes.

## Arquitectura

```
App Android ──────────► api ──► MySQL (FICHADA)
                         │ ▲
                         │ └── Panel (Next.js, del lado del servidor)
                         ├───► auth ──► MySQL (FICHADA_AUTH)
                         └───► mailer ──► SMTP
```

- **api**: dominio de fichadas. La app le habla solo a este servicio; `POST /auth/login` reenvía a auth, que no se expone.
- **auth**: usuarios, credenciales y emisión de JWT (HS256). El api verifica la firma con la `SECRET_KEY` compartida, sin consultar a auth en cada pedido.
- **mailer**: envío SMTP por HTTP interno. No usa base de datos.
- **backoffice**: el navegador nunca ve el JWT. Vive en una cookie httpOnly y los route handlers de Next lo agregan al llamar al api.

auth y mailer son servicios genéricos: traen funciones que Fichada no usa (2FA, invitados, newsletter, plantillas de automatización).

## Stack

| Parte | Tecnología |
|---|---|
| api, auth, mailer | Node.js, Express 4, Sequelize 6, MySQL |
| backoffice | Next.js 14, React 18, TypeScript, Google Maps |
| app | Expo SDK 54, React Native 0.81 |
| Infraestructura | Docker Compose, Traefik |

## Cómo levantarlo

**Requisitos:** Docker con Compose, y la infraestructura compartida levantada: red externa `net-shared`, contenedor `mysql_db` y Traefik. Este repo no la incluye; `make` lee `DB_MYSQL_ROOT_PASSWORD` de `/opt/shared/.env`.

```bash
make up      # crea los .env desde cada .env.example, crea las bases y levanta los 4 contenedores
make seed    # crea el Employee admin y la fila de ajustes (idempotente)
make logs    # logs de todos los servicios
make down    # baja los contenedores, sin tocar la infraestructura compartida
```

| Servicio | URL |
|---|---|
| Panel | `http://fichada.localhost/backoffice` |
| API | `http://fichada-api.localhost` o `http://localhost:4000` |
| Salud del API | `GET /health` |

`make help` muestra las credenciales del administrador de desarrollo. `make seed` falla con `auth respondió 404` si auth no tiene ese usuario: lo crea su migración 007 cuando `ADMIN_EMAIL` está definida.

Para la app (corre local, no en Docker):

```bash
make app-install
make app
```

Sin `EXPO_PUBLIC_API_URL`, en desarrollo apunta al gateway del emulador de Android (`10.0.2.2`) con el header `Host: fichada-api.localhost`. Para probar en un teléfono físico, definila con la URL del API.

El despliegue (imágenes en GHCR, `deploy.sh`, builds EAS y OTA) está en [DEPLOY.md](DEPLOY.md).

## Estructura

```
api/          controllers, routes y validations por entidad; models; services; jobs
backoffice/   app (páginas y route handlers), components, lib
app/          App.js (sesión y navegación), src/screens, src/api.js, src/device.js
services/
  auth/       controllers, routes, models, db/migrations, templates
  mailer/     routes, templates, config/transporter.js
Makefile      comandos de desarrollo
deploy.sh     publicación y despliegue
```

## Variables de entorno

Cada servicio tiene su `.env.example`.

| Servicio | Variables |
|---|---|
| api | `API_PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_DIALECT`, `SECRET_KEY`, `AUTH_API_URL`, `AUTH_BASIC_USER`, `AUTH_BASIC_PW`, `MAILER_API_URL`, `MAILER_BASIC_USER`, `MAILER_BASIC_PW`, `WEB_URL`, `ADMIN_EMAIL`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, `ENABLE_JOBS`, `REMINDER_UTC_OFFSET`, `CHECKIN_REMINDER_START`, `CHECKIN_REMINDER_END`, `CHECKOUT_REMINDER_START`, `CHECKOUT_REMINDER_END` |
| auth | `AUTH_PORT`, `DB_HOST_AUTH`, `DB_PORT_AUTH`, `DB_USER_AUTH`, `DB_ROOT_PASSWORD_AUTH`, `DB_NAME_AUTH`, `DB_DIALECT_AUTH`, `DB_AUTOCREATE`, `DB_POOL_MAX`, `DB_POOL_MIN`, `SECRET_KEY`, `AUTH_BASIC_USER`, `AUTH_BASIC_PW`, `SESSION_TIMEOUT`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_BLOCK_WINDOW_MS`, `AUTH_USE_JWT_LINKS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MAILER_API_URL`, `WEB_URL`, `LOGO_URL`, `APP_NAME`, `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `LOG_LEVEL` |
| mailer | `MAILER_PORT`, `MAILER_USER`, `MAILER_PASSWORD`, `MAILER_SMTP_HOST`, `MAILER_SMTP_PORT`, `MAILER_SMTP_SECURE`, `MAILER_FROM_NAME`, `MAILER_FROM_EMAIL`, `MAILER_DEV_REDIRECT_EMAIL`, `SECRET_KEY`, `AUTH_BASIC_USER`, `AUTH_BASIC_PW`, `APP_NAME`, `WEB_URL`, `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `LOG_LEVEL`. Funciones que Fichada no usa, activas solo con `true`: `ENABLE_EMAIL_LOG` (`DB_*`), `ENABLE_CONTACT` (`MAILER_CONTACT_EMAIL`, `MAILER_SALES_EMAIL`), `ENABLE_TEMPLATES` (`PROJECT_*`, `BRAND_*`), `ENABLE_MAILCHIMP` (`MAILCHIMP_*`), `ENABLE_MAILERLITE` (`MAILERLITE_API_KEY`, `CONFIG_API_URL`) |
| backoffice | `API_URL`, `AUTH_URL`, `AUTH_BASIC_USER`, `AUTH_BASIC_PW`, `GOOGLE_MAPS_API_KEY` |
| app | `EXPO_PUBLIC_API_URL` |

El `docker-compose.yml` de desarrollo no le pasa `GOOGLE_MAPS_API_KEY` al panel: sin esa key, el mapa no carga.

## Limitaciones conocidas

- No tiene tests automatizados ni linter.
- Revocar un dispositivo solo cambia su estado: el api no lo controla en cada pedido, así que el JWT sigue valiendo hasta vencer (8 horas por defecto, `SESSION_TIMEOUT`).
- Estos ajustes se guardan pero ningún flujo los aplica: ubicación obligatoria (siempre lo es), redondeo, tolerancia de tardanza, zona horaria, jornada y entrada por defecto.
- La tolerancia de puntualidad de los reportes está fija en 5 minutos.
- El registro de auditoría se consulta solo por API; el panel no tiene pantalla para verlo.

## Firebase

`app/google-services.json` no se versiona. Para compilar la app, copialo en `app/`. En EAS, cargalo como variable de tipo archivo:

```bash
cd app
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
```
