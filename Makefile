.PHONY: install docker migrate seed dev lint test typecheck clean

install:
	pnpm install

docker:
	docker-compose up -d

migrate:
	pnpm nx run infra-database:prisma:migrate:dev

seed:
	pnpm nx run infra-database:db:seed

dev:
	pnpm nx run-many -t serve --projects=api,web

lint:
	pnpm nx run-many -t lint

test:
	pnpm nx run-many -t test

typecheck:
	pnpm nx run-many -t typecheck

clean:
	rm -rf node_modules dist tmp .nx
