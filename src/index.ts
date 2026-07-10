import "dotenv/config";
import express from "express";
import { createTaskRepository } from "./repositories";
import { TaskService } from "./services/TaskService";
import { createTaskRouter } from "./routes/tasks";

const app = express();
app.use(express.json());

const repository = createTaskRepository();
const taskService = new TaskService(repository);

app.get("/health", (_req, res) => {
  res.json({ ok: true, repository: (process.env.REPOSITORY ?? "postgres").toLowerCase() });
});

// Stretch: ping Redis if REDIS_URL is configured. Optional and lazy so the
// app runs fine without Redis at all.
app.get("/health/redis", async (_req, res) => {
  if (!process.env.REDIS_URL) {
    return res.status(200).json({ ok: false, reason: "REDIS_URL not set" });
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 2000 });
    await redis.connect();
    const pong = await redis.ping();
    await redis.quit();
    res.json({ ok: pong === "PONG" });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

app.use("/tasks", createTaskRouter(taskService));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`a2-postgres listening on :${port} (repository=${process.env.REPOSITORY ?? "postgres"})`);
});
