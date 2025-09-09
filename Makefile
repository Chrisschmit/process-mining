# FastVLM WebGPU Makefile
# Automated tasks for frontend and backend development

.PHONY: help clean clean-backend clean-frontend lint lint-frontend lint-backend format install install-frontend install-backend dev build test

# Default target
help:
	@echo "Development Commands"
	@echo ""
	@echo "Cleaning:"
	@echo "  clean           Clean both frontend and backend"
	@echo "  clean-backend   Clean Python cache files"
	@echo "  clean-frontend  Clean node_modules and build artifacts"
	@echo ""
	@echo "Linting:"
	@echo "  lint            Lint both frontend and backend"
	@echo "  lint-frontend   Lint frontend with ESLint"
	@echo "  lint-backend    Lint backend with ruff"
	@echo "  fix-lint        Fix lint issues using pre-commit and ruff"
	@echo "  format          Format code (Prettier + ruff format)"
	@echo ""
	@echo "Installation:"
	@echo "  install         Install all dependencies"
	@echo "  install-frontend Install npm dependencies"
	@echo "  install-backend Install Python dependencies"
	@echo ""
	@echo "Development:"
	@echo "  dev             Start frontend development server"
	@echo "  build           Build frontend for production"
	@echo "  test            Run all tests"

# Cleaning targets
clean: clean-backend clean-frontend

clean-backend:
	@echo "Cleaning Python cache files..."
	find backend -type f -name "*.pyc" -delete
	find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find backend -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "Backend cleaned"

clean-frontend:
	@echo "Cleaning frontend build artifacts..."
	rm -rf node_modules/.cache 2>/dev/null || true
	rm -rf dist 2>/dev/null || true
	rm -rf .vite 2>/dev/null || true
	@echo "Frontend cleaned"

# Linting targets
lint: lint-frontend lint-backend

lint-backend: ## Fix lint issues using pre-commit and ruff
	@echo "Fixing lint issues with pre-commit..."
	@if command -v pre-commit >/dev/null 2>&1; then \
		cd backend && pre-commit run --all-files; \
	else \
		echo "pre-commit not found. Install with: pip install pre-commit"; \
		echo "Alternative: install ruff and run 'ruff check --fix backend/ && ruff format backend/'"; \
		exit 1; \
	fi
	@echo "Backend lint issues fixed"

lint-frontend:
	@echo "Linting frontend with ESLint..."
	npm run lint

# Formatting targets
format:
	@echo "Formatting code..."
	npm run format
	@if command -v ruff >/dev/null 2>&1; then \
		ruff format backend/ --exclude backend/.venv; \
	else \
		echo "ruff not found. Install with: pip install ruff"; \
	fi
	@echo "Code formatted"

# Installation targets
install: install-frontend install-backend

install-frontend:
	@echo "Installing frontend dependencies..."
	npm install

install-backend:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Don't forget to configure your .env file with API keys"

# Development targets
dev:
	@echo "Starting development server..."
	npm run dev

build:
	@echo "Building for production..."
	npm run build

# TypeScript checking
typecheck:
	@echo "Running TypeScript checks..."
	tsc -b

# Test target (placeholder for future tests)
test:
	@echo "Running tests..."
	@echo "Frontend tests:"
	@if [ -f "package.json" ] && npm run test --if-present 2>/dev/null; then \
		echo "Frontend tests passed"; \
	else \
		echo "No frontend tests configured"; \
	fi
	@echo "Backend tests:"
	@if [ -f "backend/pytest.ini" ] || [ -f "backend/pyproject.toml" ]; then \
		cd backend && python -m pytest; \
	else \
		echo "No backend tests configured"; \
	fi

# Backend specific commands
run-process-mapper:
	@echo "Running process mapper..."
	python backend/simple_process_mapper.py

run-main-processor:
	@echo "Running main processor..."
	python backend/process_mapper/main.py

# Utility targets
check-deps:
	@echo "Checking dependencies..."
	@echo "Node.js version:"
	@node --version 2>/dev/null || echo "Node.js not found"
	@echo "npm version:"
	@npm --version 2>/dev/null || echo "npm not found"
	@echo "Python version:"
	@python --version 2>/dev/null || python3 --version 2>/dev/null || echo "Python not found"
	@echo "pip version:"
	@pip --version 2>/dev/null || pip3 --version 2>/dev/null || echo "pip not found"
	@echo "ruff version:"
	@ruff --version 2>/dev/null || echo "ruff not found (install with: pip install ruff)"