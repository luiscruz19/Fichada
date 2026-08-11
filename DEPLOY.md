# Deploy — Fichada (test)

Dos partes independientes: el **backend** (4 imágenes Docker en un server) y la **app** (APK/AAB que se compila y se distribuye).

---

## 1) Backend

### Idea
El servidor **no compila nada**: baja **imágenes ya construidas** (GHCR) y las levanta. La infra pesada (Traefik, MySQL) es **compartida** entre proyectos (`/opt/shared`, red `net-shared`).

```
PC ──build──▶ imágenes en GHCR ──pull──▶ Server /opt/test/fichada
                                          + infra core /opt/shared (net-shared)
                                          Cloudflare → Traefik → https://fichada.sda.ovh
```

### Ruteo (todo bajo `fichada.sda.ovh`)
- **`/api`** → api de dominio (Traefik hace stripprefix; la app pega a `https://fichada.sda.ovh/api`).
- **`/backoffice`** → panel (Next con `basePath: /backoffice`; sus rutas internas `/api/*` quedan bajo `/backoffice/api/*`, sin chocar con el api).
- **auth / mailer** → internos (sin Traefik). El **mailer no usa base de datos**.

### Piezas
- **Infra core compartida** — `/opt/shared` (red `net-shared`): Traefik + `mysql_db`. Bases en el mysql compartido (MAYÚSCULAS): **`FICHADA`**, **`FICHADA_AUTH`**.
- **Imágenes** — `ghcr.io/luiscruz19/fichada-{api,backoffice,auth,mailer}:TEST`, desde cada `Dockerfile.production`.
- **`docker-compose.prod.yml`** — los 4 servicios con `build` + `image` (ghcr) + labels Traefik.
- **`deploy.sh`** — login GHCR → `build` + `push` → copia el compose al server por SSH → `pull` + `up -d` (+ seed opcional). Config en `.env.deploy.test`.
- **`.env.deploy.test`** (no versionado) — destino SSH + tag. El PAT de GHCR sale del entorno (`GITHUB_REGISTRY_TOKEN`, ya en `~/.bashrc`).
- **`.env`** en el server (`/opt/test/fichada/.env`, no versionado) — secretos runtime compartidos por los 4 servicios (ver `.env.production.example`).

### Redeploy (lo normal)
```bash
cd /opt/repository/fichada
./deploy.sh test          # build + push + pull/up en el server (toma GITHUB_REGISTRY_TOKEN del entorno)
# Re-seed: DEPLOY_RUN_SEED=true en .env.deploy.test
```

### Primera vez en el server
1. Infra core arriba: `cd /opt/shared && docker compose up -d` (red `net-shared`).
2. Crear las bases: `docker exec mysql_db mysql -uroot -p... -e "CREATE DATABASE IF NOT EXISTS \`FICHADA\`; CREATE DATABASE IF NOT EXISTS \`FICHADA_AUTH\`;"`
3. Crear `/opt/test/fichada/.env` (desde `.env.production.example` + password real del mysql compartido).
4. `./deploy.sh test` y luego seed una vez (`DEPLOY_RUN_SEED=true`).

---

## 2) App (Expo / EAS)

### Cómo elige el backend (`app/eas.json`)
- **`preview-test`** → `https://fichada.sda.ovh/api` → APK contra el server (anda en cualquier red). Para demos.
- **`preview-local`** → `http://192.168.100.8:4000` → backend local (mismo WiFi + `make up`; el api se expone en `:4000`).
- **`production`** → APK de distribución interna (`https://fichada.sda.ovh/api`), con `autoIncrement` del versionCode.

El código (`app/src/api.js`) lee `process.env.EXPO_PUBLIC_API_URL` con **precedencia**. Si no está: en desarrollo cae al gateway local de Traefik (Host header) y en la app instalada al dominio real, para que un update publicado sin la variable no deje a nadie sin backend.

### Pasos (APK nuevo)
```bash
cd app
npx eas-cli login            # cuenta Expo (owner: luiscruzz.salta)
npm run build:test           # APK contra el server → link/QR
npm run build:prod           # APK de producción
```

### Actualizar la app sin reinstalar (OTA)

Si el cambio es **solo JavaScript** (pantallas, textos, lógica), no hace falta un APK nuevo:

```bash
cd app
npm run update:test -- "qué cambió"   # canal preview-test
npm run update:prod -- "qué cambió"   # canal production
```

El teléfono la toma **al volver a primer plano**, o a mano desde el avatar → **Buscar actualización**
(ahí también se ve qué versión está corriendo). Con una **jornada abierta** no reinicia solo: descarga
la versión y la aplica en el próximo arranque, para no cortarle la pantalla a quien está por fichar.

**Sí hace falta APK nuevo** cuando cambia código nativo: dependencias con parte nativa, permisos, o el
`version` de `app.json` — ese string **es** el `runtimeVersion` (`policy: appVersion`), así que tocarlo
corta las actualizaciones de todos los APK ya instalados hasta que reinstalen.

---

## Resumen

| | Backend | App |
|---|---|---|
| Se entrega | 4 imágenes Docker en GHCR | APK (o update OTA) |
| Corre en | Server `/opt/test/fichada` (Traefik + infra compartida) | El celular |
| Se publica con | `./deploy.sh test` | `npm run build:*` (APK) · `npm run update:*` (OTA, sin reinstalar) |
| URL | api `fichada.sda.ovh/api` · panel `fichada.sda.ovh/backoffice` | consume el api |
