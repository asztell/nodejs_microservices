import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenvx from "@dotenvx/dotenvx";
import { resolve } from "node:path";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  successResponse,
} from "shared";
import { gatewayAuth } from "./middleware/gateway.auth";

dotenvx.config({
  path: resolve(__dirname, "../../../.env"),
  ignore: ["MISSING_ENV_FILE"],
});

const {
  PORT = 3000,
  AUTH_SERVICE_URL = "http://127.0.0.1:3001",
  TASK_SERVICE_URL = "http://127.0.0.1:3002",
  MEDIA_SERVICE_URL = "http://127.0.0.1:3003",
} = process.env;

const app = express();

// secure http headers
app.use(helmet());
app.use(cors());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  }),
);

app.use(httpLogger);

app.use("/health", (_req, res) => {
  successResponse(res, { service: "api-gateway" });
});

function proxyMiddlewear(URL: string, context: string) {
  return createProxyMiddleware({
    target: URL,
    changeOrigin: true,
    pathRewrite: (path) => `${context}${path}`,
  });
}

const authContext = "/auth";
app.use(
  authContext,
  gatewayAuth,
  proxyMiddlewear(AUTH_SERVICE_URL, authContext),
);

const taskContext = "/tasks";
app.use(
  taskContext,
  gatewayAuth,
  proxyMiddlewear(TASK_SERVICE_URL, taskContext),
);

const mediaContext = "/media";
app.use(
  mediaContext,
  gatewayAuth,
  proxyMiddlewear(MEDIA_SERVICE_URL, mediaContext),
);

app.use((_req, _res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API gateway running on port ${PORT}`);
});
