import { Kafka, KafkaJSProtocolError, Admin } from "kafkajs";
import { logger } from "../logger/logger.js";

export interface KafkaMessageSnapshot<T = Record<string, unknown>> {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: T | null;
  timestamp: string;
}

export interface FetchMessagesOptions {
  kafkaInstance: Kafka;
  topicName: string;
  timeoutMs?: number;
}

async function calculateTotalExpectedMessages(
  admin: Admin,
  topicName: string,
): Promise<number> {
  try {
    const topicOffsets = await admin.fetchTopicOffsets(topicName);
    return topicOffsets.reduce(
      (total, part) => total + parseInt(part.high, 10),
      0,
    );
  } catch (error) {
    if (error instanceof KafkaJSProtocolError && error.code === 3) {
      logger.warn(
        { topicName },
        "Topic does not exist yet. Returning empty dataset.",
      );
      return 0;
    }
    throw error;
  }
}

function parseMessageValue<T>(buffer: Buffer | null): T | null {
  if (!buffer) return null;
  try {
    return JSON.parse(buffer.toString()) as T;
  } catch {
    return null;
  }
}

export async function fetchAllTopicMessages<T = Record<string, unknown>>({
  kafkaInstance,
  topicName,
  timeoutMs = 5000,
}: FetchMessagesOptions): Promise<KafkaMessageSnapshot<T>[]> {
  const admin = kafkaInstance.admin();
  const consumer = kafkaInstance.consumer({
    groupId: `api-snapshot-${topicName}-${Date.now()}`,
  });

  try {
    // Await core admin & consumer connections concurrently
    await Promise.all([admin.connect(), consumer.connect()]);

    const totalMessagesToRead = await calculateTotalExpectedMessages(
      admin,
      topicName,
    );
    if (totalMessagesToRead === 0) return [];

    const messages: KafkaMessageSnapshot<T>[] = [];
    let completedSuccessfully = false;

    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    await new Promise<void>((resolve, reject) => {
      const fallbackTimer = setTimeout(() => {
        if (completedSuccessfully) return;
        resolve(); // Fallback resolution on network timeouts
      }, timeoutMs);

      consumer
        .run({
          eachMessage: async ({ topic, partition, message }) => {
            messages.push({
              topic,
              partition,
              offset: message.offset,
              key: message.key ? message.key.toString() : null,
              value: parseMessageValue<T>(message.value),
              timestamp: message.timestamp,
            });

            if (messages.length >= totalMessagesToRead) {
              completedSuccessfully = true;
              clearTimeout(fallbackTimer);
              consumer.pause([{ topic }]); // Halt event loops safely without internal deadlocks
              resolve();
            }
          },
        })
        .catch((runError) => {
          clearTimeout(fallbackTimer);
          reject(runError);
        });
    });

    return messages;
  } finally {
    // Localized connection teardown sequence
    try {
      await consumer.disconnect();
    } catch (err) {
      logger.warn({ err }, "Error disconnecting consumer layer cleanly");
    }
    await admin.disconnect();
  }
}
