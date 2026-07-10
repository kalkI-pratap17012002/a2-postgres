# A2: Postgres-backed task service

A small Express + TypeScript task API. Originally used an in-memory store;
this task swapped it for a real Postgres repository behind the same
interface, and wired app + database together with `docker compose up`.

## Stack

Node.js 20, TypeScript, Express, `pg` (node-postgres), Postgres 16.

## Run everything with one command

```bash
cp .env.example .env
docker compose up
```

This starts two containers: `db` (Postgres 16, with a named volume so data
survives restarts) and `app` (this service, built from the `Dockerfile`).
The app waits for Postgres's healthcheck before starting. API is at
`http://localhost:3000`, Postgres is published at `localhost:5432`.

```bash
curl -X POST localhost:3000/tasks -H 'content-type: application/json' -d '{"title":"buy milk"}'
curl localhost:3000/tasks
```

## Run without Docker (local dev)

```bash
npm install
cp .env.example .env   # DATABASE_URL points at localhost:5432 by default
docker run -d --name a2-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=a2 \
  -p 5432:5432 -v a2-pgdata:/var/lib/postgresql/data \
  -v "$(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" postgres:16-alpine
npm run dev
```

Set `REPOSITORY=memory` in `.env` to fall back to the original in-memory
store (no persistence) if you ever need it for a quick test without a
database running.

## Architecture: why only one file changed

```
routes/tasks.ts  ->  services/TaskService.ts  ->  repositories/TaskRepository.ts (interface)
                                                          ^                ^
                                            InMemoryTaskRepository   PgTaskRepository
```

`TaskService` and the Express routes depend only on the `TaskRepository`
interface (`src/repositories/TaskRepository.ts`). Neither imports a
concrete store. `src/repositories/index.ts` is the single factory that
decides, from `REPOSITORY` in `.env`, which concrete class to construct.

Moving to Postgres meant: writing `PgTaskRepository.ts` (new file) and
flipping the factory's default from memory to postgres. `TaskService.ts`
and `routes/tasks.ts` were never touched — that's the layering paying off,
not a claim, you can diff it: `InMemoryTaskRepository` and
`PgTaskRepository` both implement `list/getById/create/update/remove`
against the same `Task` shape.

## `.env`

`.env` is gitignored; `.env.example` is committed and documents every
variable. `docker-compose.yml` overrides `DATABASE_URL` for the `app`
service so it points at the `db` hostname on the compose network — `.env`'s
copy (pointing at `localhost`) is only used for host-side `npm run dev`.

## Schema

One SQL file, `db/init.sql`, mounted into
`/docker-entrypoint-initdb.d/` — Postgres runs it automatically the first
time the volume is empty, and skips it on every later start. That's the
mechanism persistence relies on.

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id         UUID PRIMARY KEY,
    title      TEXT NOT NULL,
    done       BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Proving persistence (what I actually ran)

```bash
docker compose up -d
curl -X POST localhost:3000/tasks -H 'content-type: application/json' -d '{"title":"survives a restart"}'
curl localhost:3000/tasks              # -> one row

docker compose down                    # stops + removes containers, keeps the named volume "pgdata"
docker compose up -d
curl localhost:3000/tasks              # -> same row, same id, same created_at
```

The row survived because `docker compose down` (without `-v`) removes the
containers but not the `pgdata` volume, and `db/init.sql` only runs against
an empty data directory — so the second `up` reattaches to the existing
data instead of recreating the table. To contrast, `docker compose down -v`
deletes the volume and the table comes back empty, confirming the volume
is what's doing the work.

## Stretch

### Redis

`docker-compose.yml` has a commented-out `redis` service and named volume.
Uncomment both, set `REDIS_URL=redis://redis:6379` in `.env`, and
`GET /health/redis` pings it (`ioredis`, lazy import so the app runs fine
with Redis absent — this is prep for W4's caching work, not required by
the store swap itself).

### Index + EXPLAIN ANALYZE

```bash
npm run seed -- 200000     # seeds 200k rows, ~5% done=false
npm run explain             # EXPLAIN ANALYZE before the index
docker compose exec -T db psql -U postgres -d a2 < db/002_index.sql
npm run explain             # EXPLAIN ANALYZE after the index
```

Query used: `SELECT * FROM tasks WHERE done = false`. Before the index,
expect a `Seq Scan` over the full table; after `CREATE INDEX idx_tasks_done
ON tasks (done)`, expect an `Index Scan` (or `Bitmap Heap Scan`) with a
lower execution time. Paste your actual before/after `EXPLAIN ANALYZE`
output here once you've run it against your seeded data — plan choice and
timing depend on the real row counts and selectivity in your run.

## Endpoints

- `GET /health`
- `GET /health/redis` (stretch)
- `GET /tasks`, `GET /tasks/:id`
- `POST /tasks` `{ "title": string }`
- `PATCH /tasks/:id` `{ "title"?: string, "done"?: boolean }`
- `DELETE /tasks/:id`
