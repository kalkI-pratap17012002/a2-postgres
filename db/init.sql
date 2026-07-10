-- Runs automatically the first time the postgres container initializes
-- its data directory (docker-entrypoint-initdb.d convention). Once the
-- volume has data, Postgres skips this on subsequent starts -- that's
-- what makes persistence work.

CREATE TABLE IF NOT EXISTS tasks (
    id         UUID PRIMARY KEY,
    title      TEXT NOT NULL,
    done       BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
