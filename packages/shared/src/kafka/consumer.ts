import type { Consumer } from "kafkajs";
import { createKafkaClient } from "./client.js";
import { logger } from "../logger/logger.js";

export async function crateConsumer(
  clientId: string,
  groupId: string,
): Promise<Consumer> {
  const kafka = createKafkaClient(clientId);
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  logger.info({ clientId, groupId }, "kafka consumer connected");
  return consumer;
}
