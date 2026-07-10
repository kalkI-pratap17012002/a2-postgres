-- Stretch: run manually against a seeded table to compare EXPLAIN ANALYZE
-- before/after (see README "Stretch: index" section).
--   docker compose exec db psql -U postgres -d a2 -f /dev/stdin < db/002_index.sql
CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks (done);
