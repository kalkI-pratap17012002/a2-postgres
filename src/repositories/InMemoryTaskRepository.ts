import { randomUUID } from "node:crypto";
import { Task, TaskRepository } from "./TaskRepository";

/**
 * The original store. Kept as-is, unmodified, to prove that swapping to
 * Postgres only required adding PgTaskRepository + the factory in
 * repositories/index.ts -- this file, TaskService, and the routes never
 * changed.
 */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  async list(): Promise<Task[]> {
    return [...this.tasks.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(title: string): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      title,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.tasks.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}
