# TodoMVC Example

[Demo](https://todovmc.livestore.dev)

## Running locally

```bash
bun
bun dev
```

## Docker Services

The `docker-compose.yml` includes two services:

1. **PostgreSQL** - The database server (port 5432 by default)
2. **PgBouncer** - Connection pooler for PostgreSQL (port 6432 by default)

### Using PgBouncer

To connect through PgBouncer instead of directly to PostgreSQL, update your connection string:

```toml
# Direct PostgreSQL connection
PG_CONNECTION_STRING = "postgresql://postgres:password@localhost:5432/todo-mvc-sync-postgres?sslmode=disable"

# PgBouncer connection (recommended for production-like testing)
PG_CONNECTION_STRING = "postgresql://postgres:password@localhost:6432/todo-mvc-sync-postgres?sslmode=disable"
```

PgBouncer uses transaction-level pooling, which helps manage connection limits and improves performance under load.

## Tests

1. Make sure to build from the root dir `pnpm run build`
1. Run `docker compose up` in this directory
1. Run `pnpm run test`
