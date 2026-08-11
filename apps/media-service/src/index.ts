import dotenvx from "@dotenvx/dotenvx";
import express from "express";
import { resolve } from "node:path";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  requireGatewaySecret,
  successResponse,
} from "shared";
import mediaRoutes from "./routes/media.routes";

dotenvx.config({
  path: resolve(__dirname, "../../../.env"),
  ignore: ["MISSING_ENV_FILE"],
});

const PORT = process.env.MEDIA_PORT || 3003;

const app = express();

app.use(httpLogger);

app.use(express.json());

app.get("/health", (_req, res) => {
  successResponse(res, { service: "media-service" });
});

app.use("/media", requireGatewaySecret, mediaRoutes);

app.use((_req, _res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Media service is now running on port ${PORT}`);
});
