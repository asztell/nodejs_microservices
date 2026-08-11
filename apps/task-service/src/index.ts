import express from "express";
import { resolve } from "node:path";
import dotenvx from "@dotenvx/dotenvx";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  requireGatewaySecret,
  successResponse,
} from "shared";
import taskRoutes from "./routes/task.routes";
import { initKafka } from "./kafka";

dotenvx.config({
  path: resolve(__dirname, "../../../.env"),
  ignore: ["MISSING_ENV_FILE"],
});

const PORT = process.env.TASK_PORT || 3002;

const app = express();

app.use(httpLogger);

app.use(express.json());

app.get("/health", (_req, res) => {
  successResponse(res, { service: "task-service" });
});

app.use("/tasks", requireGatewaySecret, taskRoutes);

app.use((_req, _res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(errorHandler);

async function initializeKafka() {
  try {
    await initKafka();
  } catch (error) {
    logger.error({ error }, "kafka producer init failed");
  }
}

app.listen(PORT, () => {
  logger.info(`Task service is now running on port ${PORT}`);
  initializeKafka();
});
