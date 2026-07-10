import { Task, TaskRepository } from "../repositories/TaskRepository";

/**
 * Business logic layer. Depends only on the TaskRepository interface --
 * never imports InMemoryTaskRepository or PgTaskRepository directly.
 * This class did not change at all when storage moved to Postgres.
 */
export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  listTasks(): Promise<Task[]> {
    return this.repo.list();
  }

  getTask(id: string): Promise<Task | null> {
    return this.repo.getById(id);
  }

  createTask(title: string): Promise<Task> {
    const trimmed = title?.trim();
    if (!trimmed) {
      throw new Error("title is required");
    }
    return this.repo.create(trimmed);
  }

  updateTask(id: string, patch: { title?: string; done?: boolean }): Promise<Task | null> {
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new Error("title cannot be empty");
    }
    return this.repo.update(id, patch);
  }

  deleteTask(id: string): Promise<boolean> {
    return this.repo.remove(id);
  }
}
