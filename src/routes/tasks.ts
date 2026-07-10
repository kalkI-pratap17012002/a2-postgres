import { Router } from "express";
import { TaskService } from "../services/TaskService";

/**
 * Routes only ever see TaskService. No knowledge of memory vs. Postgres
 * lives here either -- also unchanged by the storage swap.
 */
export function createTaskRouter(service: TaskService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const tasks = await service.listTasks();
    res.json(tasks);
  });

  router.get("/:id", async (req, res) => {
    const task = await service.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "not found" });
    res.json(task);
  });

  router.post("/", async (req, res) => {
    try {
      const task = await service.createTask(req.body?.title);
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const task = await service.updateTask(req.params.id, {
        title: req.body?.title,
        done: req.body?.done,
      });
      if (!task) return res.status(404).json({ error: "not found" });
      res.json(task);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const removed = await service.deleteTask(req.params.id);
    if (!removed) return res.status(404).json({ error: "not found" });
    res.status(204).send();
  });

  return router;
}
