.PHONY: help dev build down logs migrate shell createsuperuser test \
        prod prod-build prod-down prod-logs

# ── Development ───────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Platform Diaspora Ivoirienne — dev commands"
	@echo ""
	@echo "  Dev stack:"
	@echo "    make dev              Start dev containers (hot-reload)"
	@echo "    make build            Rebuild dev images"
	@echo "    make down             Stop & remove dev containers"
	@echo "    make logs             Follow container logs"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate          Run Django migrations"
	@echo "    make shell            Open Django shell"
	@echo "    make createsuperuser  Create Django admin user"
	@echo ""
	@echo "  Testing:"
	@echo "    make test             Run backend pytest suite"
	@echo ""
	@echo "  Production:"
	@echo "    make prod             Start production stack (detached)"
	@echo "    make prod-build       Rebuild production images"
	@echo "    make prod-down        Stop production stack"
	@echo "    make prod-logs        Follow production logs"
	@echo ""

dev:
	docker compose up

build:
	docker compose build

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose run --rm backend python manage.py migrate

shell:
	docker compose run --rm backend python manage.py shell

createsuperuser:
	docker compose run --rm backend python manage.py createsuperuser

test:
	docker compose run --rm \
	  -e DJANGO_SETTINGS_MODULE=config.settings.test \
	  backend pytest

# ── Production ────────────────────────────────────────────────────────────────
prod:
	docker compose -f docker-compose.prod.yml up -d

prod-build:
	docker compose -f docker-compose.prod.yml build

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f
