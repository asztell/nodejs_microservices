import { Kafka, logLevel, type KafkaConfig } from "kafkajs";
import { boolean } from "zod";

export function createKafkaClient(
  clientId: string,
  config: Partial<KafkaConfig> = {},
) {
  const brokers = (process.env.KAFKA_BROKER || "loalhost:9092")
    .split(",")
    .map((broker) => broker.trim())
    .filter(boolean);
  if (brokers.length === 0) {
    throw new Error("KAFKA_BROKER is empty");
  }
  return new Kafka({
    clientId,
    brokers,
    logLevel: logLevel.ERROR,
    retry: {
      retries: 8,
    },
    ...config,
  });
}
