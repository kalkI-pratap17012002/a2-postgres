import "dotenv/config";
import { randomUUID } from "node:crypto";
import { getPool, closePool } from "../src/db/pool";

/**
 * Stretch helper: seeds a large batch of rows so EXPLAIN ANALYZE on
 * `SELECT * FROM tasks WHERE done = false` has enough data to show a
 * real difference between a seq scan and an index scan.
 *
 * Usage: npm run seed -- 200000
 */
async function main() {
  const count = Number(process.argv[2] ?? 200_000);
  const pool = getPool();
  const batchSize = 1000;

  console.log(`Seeding ${count} rows...`);
  for (let i = 0; i < count; i += batchSize) {
    const rows: string[] = [];
    const params: unknown[] = [];
    const n = Math.min(batchSize, count - i);
    for (let j = 0; j < n; j++) {
      const idx = j * 3;
      rows.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, now())`);
      params.push(randomUUID(), `seed task ${i + j}`, Math.random() < 0.05);
    }
    await pool.query(
      `INSERT INTO tasks (id, title, done, created_at) VALUES ${rows.join(",")}`,
      params
    );
    if (i % 20000 === 0) console.log(`  ${i + n}/${count}`);
  }

  console.log("Done.");
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
