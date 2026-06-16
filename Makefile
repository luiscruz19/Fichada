.PHONY: help env dbs up down logs ps restart build clean seed app-install app

SHARED_ENV := /opt/shared/.env
DB_PW := $(shell grep -E '^DB_MYSQL_ROOT_PASSWORD' $(SHARED_ENV) 2>/dev/null | cut -d= -f2- | tr -d "'\"")

help:
	@echo "Fichada — usa la infra compartida de /opt/shared (Traefik + mysql_db en net-shared)."
	@echo ""
	@echo "  make up          .env + DBs + levanta auth/mailer/api/backoffice en net-shared"
	@echo "  make seed        Crea el Employee admin vinculado + ajustes globales"
	@echo "  make dbs         Crea/asegura las bases FICHADA, FICHADA_AUTH, FICHADA_MAILER"
	@echo "  make down        Baja los contenedores de fichada (no toca la infra compartida)"
	@echo "  make logs|ps     Logs / estado"
	@echo "  make app-install Instala dependencias de la app mobile (Expo)"
	@echo "  make app         Arranca la app del empleado (Expo / Metro)"
	@echo ""
	@echo "Acceso: backoffice http://fichada.localhost · api http://fichada-api.localhost · auth http://fichada-auth.localhost"
	@echo "Admin demo: admin@fichada.com / ChangeMe123!"
	@echo "Requiere /opt/shared levantado (red net-shared + mysql_db + traefik)."

# Crea los .env desde los .env.example e inyecta el password del MySQL compartido.
env:
	@for d in api services/auth services/mailer; do \
	  if [ ! -f $$d/.env ]; then cp $$d/.env.example $$d/.env && echo "creado $$d/.env"; fi; \
	done
	@if [ -z "$(DB_PW)" ]; then echo "⚠ No pude leer DB_MYSQL_ROOT_PASSWORD de $(SHARED_ENV)"; else \
	  sed -i "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$(DB_PW)|" api/.env; \
	  sed -i "s|^DB_ROOT_PASSWORD_AUTH=.*|DB_ROOT_PASSWORD_AUTH=$(DB_PW)|" services/auth/.env; \
	  sed -i "s|^DB_ROOT_PASSWORD_MAILER=.*|DB_ROOT_PASSWORD_MAILER=$(DB_PW)|" services/mailer/.env; \
	  echo "✓ password del MySQL compartido inyectado en los .env"; fi

# Crea las bases del proyecto en el MySQL compartido (idempotente). El mailer no usa DB.
dbs:
	@docker exec mysql_db sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "\
	  CREATE DATABASE IF NOT EXISTS FICHADA CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; \
	  CREATE DATABASE IF NOT EXISTS FICHADA_AUTH CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"' \
	  && echo "✓ bases FICHADA / FICHADA_AUTH aseguradas"

up: env dbs
	docker compose up -d --build

down:
	docker compose down

# Crea/asegura el Employee admin vinculado + ajustes globales.
seed:
	docker compose exec fichada_api node db/seed.js

clean: down

logs:
	docker compose logs -f

ps:
	docker compose ps

restart:
	docker compose restart

build:
	docker compose build

# --- App mobile (Expo) — corre local, no en Docker (necesita Metro + device/emulador) ---
app-install:
	cd app && npm install

app:
	cd app && npx expo start
