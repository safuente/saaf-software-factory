# Standard targets (policies/conventions.md §2). Ports, URLs and credentials come from .env.
-include .env
export

SHELL := /bin/bash
MAKEFLAGS += --no-print-directory
STAGE := scripts/stage.sh
TASK := scripts/tasks.sh

.PHONY: install up down seed lint test e2e check openapi

install: ## Install backend, frontend and Playwright dependencies from lock files
	@$(STAGE) install $(TASK) install

up: ## Build and start db, backend and frontend; returns when all are healthy (max 120 s)
	@$(TASK) up

down: ## Stop and remove this worktree's containers, network and volumes
	@$(STAGE) down $(TASK) down

seed: ## Load local review data (idempotent)
	@$(TASK) seed

lint: ## Lint, format check, OpenAPI contract check and type check; no stack needed
	@$(STAGE) lint $(TASK) lint
	@$(STAGE) typecheck $(TASK) typecheck

test: ## All tests with coverage (needs up); T=<path or test id> runs only those, no coverage
ifdef T
	@$(TASK) test-only "$(T)"
else
	@$(STAGE) test $(TASK) test
endif

e2e: ## Playwright against APP_URL (needs up); T=<spec file> runs only that file
	@$(STAGE) e2e $(TASK) e2e

check: ## Local CI: install, lint, typecheck, test, build, scan (needs up)
	@$(STAGE) install $(TASK) install
	@$(STAGE) lint $(TASK) lint
	@$(STAGE) typecheck $(TASK) typecheck
	@$(STAGE) test $(TASK) test
	@$(STAGE) build $(TASK) build
	@$(STAGE) scan $(TASK) scan

openapi: ## Regenerate backend/openapi.json and the frontend API types from it
	@$(STAGE) openapi $(TASK) openapi
