import { TaskRepository } from "./TaskRepository";
import { InMemoryTaskRepository } from "./InMemoryTaskRepository";
import { PgTaskRepository } from "./PgTaskRepository";
import { getPool } from "../db/pool";

/**
 * THE ONE FILE THAT CHANGES.
 *
 * Everything upstream of this factory (TaskService, the routes, index.ts's
 * wiring) only ever talks to the TaskRepository interface. To go from
 * "demo with an in-memory store" to "real app with Postgres", this is the
 * single place that decides which concrete class gets constructed.
 *
 * REPOSITORY=memory  -> original in-memory store (no persistence)
 * REPOSITORY=postgres (default) -> Postgres-backed store (persists across restarts)
 */
export function createTaskRepository(): TaskRepository {
  const mode = (process.env.REPOSITORY ?? "postgres").toLowerCase();

  if (mode === "memory") {
    return new InMemoryTaskRepository();
  }

  return new PgTaskRepository(getPool());
}
