# Docker commands

.PHONY: start
start: 
	@docker compose up --remove-orphans $(options)

.PHONY: start-prod
start-prod: 
	@docker compose -f docker-compose.prod.yml up -d --remove-orphans $(options)

# Build commands 

.PHONY: build
build: 
	@$(MAKE) start options="--build" 

.PHONY: build-prod
build-prod: 
	@$(MAKE) start-prod options="--build"