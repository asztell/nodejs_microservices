import dotenvx from "@dotenvx/dotenvx";
import { resolve } from "node:path";
import express from "express";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  requireGatewaySecret,
  successResponse,
} from "shared";
import {
  startKafka,
  shutdownWorkflowKafka,
} from "./services/workflow.services";
import workflowRoutes from "./routes/workflow.routes";
import kafkaRoutes from "./routes/kafka.routes";

dotenvx.config({
  path: resolve(__dirname, "../../../.env"),
  ignore: ["MISSING_ENV_FILE"],
});

const PORT = process.env.WORKFLOW_PORT || 3003;

const app = express();

app.use(httpLogger);

app.use(express.json());

app.get("/health", (_req, res) => {
  successResponse(res, { service: "workflow-service" });
});

app.use("/workflows", requireGatewaySecret, workflowRoutes);
app.use("/kafka", requireGatewaySecret, kafkaRoutes);

app.use((_req, _res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(errorHandler);

async function startServer() {
  try {
    await startKafka();
    const server = app.listen(PORT, () => {
      logger.info(`Workflow service is now running on port ${PORT}`);
    });
    const gracefulExit = async (signal: string) => {
      logger.warn(`Received ${signal}, unwinding application threads.`);
      server.close(async () => {
        await shutdownWorkflowKafka(); // Clean disconnection
        process.exitCode = 0;
      });
    };
    process.on("SIGTERM", () => gracefulExit("SIGTERM"));
    process.on("SIGINT", () => gracefulExit("SIGINT"));
  } catch (error) {
    logger.error(
      { error },
      "Critical startup dependency failed. Exiting process.",
    );
    process.exitCode = 0;
  }
}

startServer();
