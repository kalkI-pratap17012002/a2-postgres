import "dotenv/config";
import { getPool, closePool } from "../src/db/pool";

/**
 * Stretch helper: prints EXPLAIN ANALYZE for the query an index would
 * speed up. Run once before `psql -f db/002_index.sql` and once after,
 * paste both outputs into the README.
 */
async function main() {
  const pool = getPool();
  const { rows } = await pool.query(
    "EXPLAIN ANALYZE SELECT * FROM tasks WHERE done = false"
  );
  for (const row of rows) console.log(row["QUERY PLAN"]);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
