import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Task, TaskRepository } from "./TaskRepository";

interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  created_at: Date;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Real repository backed by Postgres. Implements the exact same
 * TaskRepository interface as InMemoryTaskRepository -- TaskService and
 * the Express routes import only the interface, so this class is the
 * only thing that had to be written to move storage from memory to disk.
 */
export class PgTaskRepository implements TaskRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT id, title, done, created_at FROM tasks ORDER BY created_at ASC"
    );
    return rows.map(rowToTask);
  }

  async getById(id: string): Promise<Task | null> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT id, title, done, created_at FROM tasks WHERE id = $1",
      [id]
    );
    return rows[0] ? rowToTask(rows[0]) : null;
  }

  async create(title: string): Promise<Task> {
    const { rows } = await this.pool.query<TaskRow>(
      `INSERT INTO tasks (id, title, done, created_at)
       VALUES ($1, $2, false, now())
       RETURNING id, title, done, created_at`,
      [randomUUID(), title]
    );
    return rowToTask(rows[0]);
  }

  async update(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null> {
    const { rows } = await this.pool.query<TaskRow>(
      `UPDATE tasks
       SET title = COALESCE($2, title),
           done  = COALESCE($3, done)
       WHERE id = $1
       RETURNING id, title, done, created_at`,
      [id, patch.title ?? null, patch.done ?? null]
    );
    return rows[0] ? rowToTask(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  }
}
