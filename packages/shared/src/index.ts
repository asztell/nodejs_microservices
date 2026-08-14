export { getPool, closePool } from "./db/pool.js";
export { AppError } from "./errors/AppError.js";
export { errorHandler } from "./errors/errorHandler.js";
export { logger } from "./logger/logger.js";
export { httpLogger } from "./logger/httpLogger.js";
export { successResponse, failureResponse } from "./response/response.js";
export { validateBody } from "./validation/validateBody.js";
export type { JwtPayload, UserRole } from "./auth/types.js";
export { signToken, verifyToken } from "./auth/jwt.js";
export { requireGatewaySecret } from "./auth/gateway.auth.js";
export { TOPICS } from "./kafka/topics.js";
export { createKafkaClient } from "./kafka/client.js";
export {
  createProducer,
  publishJSON,
  publishJSONSafely,
} from "./kafka/producer.js";
export { createConsumer, runConsumer } from "./kafka/consumer.js";
export { fetchAllTopicMessages } from "./kafka/fetchAllMessages.js";
export { fetchAllActiveTopics } from "./kafka/fetchAllActiveTopics.js";
