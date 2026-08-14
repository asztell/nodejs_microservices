import type { Consumer, EachMessagePayload, Producer } from "kafkajs";
import { createKafkaClient } from "./client.js";
import { logger } from "../logger/logger.js";

export async function createConsumer(
  clientId: string,
  groupId: string,
): Promise<Consumer> {
  const kafka = createKafkaClient(clientId);
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  logger.info(`${clientId} - Kafka consumer connected`);
  return consumer;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RunConsumerOptions {
  fromBeginning?: boolean;
  maxRetries?: number; // Exposed configuration option
  dlqProducer?: Producer; // Optional dedicated producer for DLQ routing
}

export async function runConsumer(
  consumer: Consumer,
  topics: string[],
  onMessage: (payload: EachMessagePayload) => Promise<void>,
  options?: RunConsumerOptions,
): Promise<void> {
  // Fallback to a sensible default if the user doesn't provide maxRetries
  const defaultMaxRetries = options?.maxRetries ?? 3;

  await consumer.subscribe({
    topics,
    fromBeginning: options?.fromBeginning ?? false,
  });

  await consumer.run({
    eachMessage: async (payload) => {
      const { topic, partition, message } = payload;

      let attempt = 0;

      while (attempt <= defaultMaxRetries) {
        try {
          logger.info(
            {
              topic,
              partition,
              offset: message.offset,
              key: message?.key?.toString(),
            },
            "Kafka messages received",
          );
          await onMessage(payload);
          return;
        } catch (onMessageError: unknown) {
          attempt += 1;
          const error = onMessageError as Error & { isDataError?: boolean };
          // Data validation failure (Poison Pill - will not change over iterations)
          if (
            (error instanceof Error && error?.name === "ValidationError") ||
            error?.isDataError === true
          ) {
            logger.error(
              {
                topic,
                partition,
                offset: message.offset,
                key: message?.key?.toString(),
                error: error.message,
              },
              "Poison pill detected. Routing to DLQ and skipping.",
            );

            if (options?.dlqProducer) {
              await options.dlqProducer.send({
                topic: `${topic}.dlq`,
                messages: [{ key: message.key, value: message.value }],
              });
            }
            return;
          }

          // Infrastructure failure (Transient - might improve over iterations)
          if (attempt <= defaultMaxRetries) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            logger.warn(
              { topic, partition, offset: message.offset, attempt, backoffMs },
              `Transient processing error. Retrying in ${backoffMs}ms...`,
            );
            await sleep(backoffMs);
          } else {
            // Max retries exceeded
            logger.error(
              { topic, partition, offset: message.offset },
              "Max retries reached. Crashing consumer to preserve data consistency.",
            );
            throw error;
          }
        }
      }
    },
  });
}
