export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface TaskRepository {
  list(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(title: string): Promise<Task>;
  update(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null>;
  remove(id: string): Promise<boolean>;
}
