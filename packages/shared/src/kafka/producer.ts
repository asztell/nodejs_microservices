import type { Producer, RecordMetadata } from "kafkajs";
import { createKafkaClient } from "./client.js";
import { logger } from "../logger/logger.js";

export async function createProducer(clientId: string): Promise<Producer> {
  const kafka = createKafkaClient(clientId);
  const producer = kafka.producer();
  try {
    await producer.connect();
    logger.info(`${clientId} - Kafka producer connected`);
    return producer;
  } catch (error) {
    logger.error(
      { clientId, error: (error as Error).message },
      `${clientId} - Failed to connect Kafka producer`,
    );
    throw error;
  }
}

export async function publishJSON(
  producer: Producer,
  topic: string,
  payload: Record<string, unknown>,
  key?: string,
): Promise<RecordMetadata[]> {
  const result = await producer.send({
    topic,
    messages: [
      {
        key: key ?? null,
        value: JSON.stringify(payload),
      },
    ],
  });
  logger.info({ topic, payload }, "Kafka event published");
  return result;
}

export async function publishJSONSafely(
  producer: Producer | null,
  topic: string,
  payload: Record<string, unknown>,
  key?: string,
): Promise<void> {
  if (!producer) {
    logger.warn({ topic }, "Kafka producer is not ready");
    return;
  }
  try {
    await publishJSON(producer, topic, payload, key);
  } catch (error) {
    logger.error({ error, topic }, "Kafka publish failed");
  }
}
