.PHONY: help up down shell composer-install symfony-console db-create test-db-create fixtures-load serve test backend-setup frontend-setup frontend-install frontend-dev frontend-start frontend-build setup stop-all

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker commands
up: ## Start Docker containers
	docker compose up -d --build

down: ## Stop Docker containers
	docker compose down

stop-all: ## Stop all services (Docker + frontend)
	@echo "Stopping all services..."
	@pkill -f "vite" || true
	@docker compose down
	@echo "All services stopped"

shell: ## Enter PHP container bash
	docker compose exec php bash

# Backend commands (run in Docker)
env-setup: ## Create .env file from .env.example if it doesn't exist
	@if [ ! -f symfony/.env ]; then \
		echo "Creating .env file from .env.example..."; \
		cp symfony/.env.example symfony/.env; \
		echo ".env file created successfully!"; \
	else \
		echo ".env file already exists"; \
	fi

composer-install: ## Install Composer dependencies (in Docker)
	docker compose exec php composer install --no-interaction --optimize-autoloader

symfony-console: ## Run Symfony console (usage: make symfony-console CMD="cache:clear")
	docker compose exec php php bin/console $(CMD)

db-create: ## Create database and run migrations (in Docker)
	docker compose exec php php bin/console doctrine:database:create --if-not-exists --no-interaction
	docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction

db-reset: ## Drop and recreate database (in Docker)
	docker compose exec php php bin/console doctrine:database:drop --force --if-exists --no-interaction
	@$(MAKE) db-create

test-db-create: ## Create test database and run migrations (in Docker)
	docker compose exec php php bin/console doctrine:database:create --env=test --if-not-exists --no-interaction
	docker compose exec php php bin/console doctrine:migrations:migrate --env=test --no-interaction

fixtures-load: ## Load database fixtures (in Docker)
	docker compose exec php php bin/console doctrine:fixtures:load --append --no-interaction

test: ## Run all PHPUnit tests (in Docker)
	docker compose exec php php bin/phpunit

test-unit: ## Run unit tests only (in Docker)
	docker compose exec php php bin/phpunit --testsuite="Unit Tests"

test-integration: ## Run integration tests only (in Docker)
	docker compose exec php php bin/phpunit --testsuite="Integration Tests"

cache-clear: ## Clear Symfony cache (in Docker)
	docker compose exec php php bin/console cache:clear

backend-setup: env-setup up composer-install db-create ## Setup backend (Docker + install + database)
	@echo "Backend setup complete!"

# Frontend commands
frontend-install: ## Install frontend dependencies
	cd frontend && npm install --legacy-peer-deps

frontend-dev: ## Start frontend development server (foreground)
	cd frontend && npm run dev

frontend-start: ## Start frontend development server (background)
	@echo "Starting frontend development server in background..."
	@cd frontend && npm run dev > /dev/null 2>&1 &
	@echo "Frontend started at http://localhost:5176"

frontend-restart: ## Restart frontend development server
	@echo "Restarting frontend development server..."
	@pkill -f "vite" || true
	@sleep 1
	@cd frontend && npm run dev > /dev/null 2>&1 &
	@echo "Frontend restarted at http://localhost:5176"

frontend-build: ## Build frontend for production
	cd frontend && npm run build

frontend-setup: frontend-install ## Setup frontend (install dependencies)
	@echo "Frontend setup complete!"

# Complete setup
setup: backend-setup frontend-setup frontend-start ## Complete setup (Docker + backend + frontend + start)
	@echo ""
	@echo "Setup Complete!"
	@echo ""
	@echo "Services running:"
	@echo "  Backend API: http://localhost:8080"
	@echo "  Frontend: http://localhost:5176"
	@echo "  API Docs: http://localhost:8080/api/doc"
	@echo ""
	@echo "Useful commands:"
	@echo "  make test          - Run all tests"
	@echo "  make shell         - Enter PHP container"
	@echo "  make frontend-dev  - View frontend logs (Ctrl+C to stop)"
	@echo "  make down          - Stop all services"
	@echo ""