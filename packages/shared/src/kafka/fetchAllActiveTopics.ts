// Location: @my-monorepo/shared-kafka / src / utils / list-topics.ts
import { Kafka } from "kafkajs";

interface ListTopicsOptions {
  kafkaInstance: Kafka;
}

export async function fetchAllActiveTopics({
  kafkaInstance,
}: ListTopicsOptions): Promise<string[]> {
  const admin = kafkaInstance.admin();
  try {
    await admin.connect();
    const topics: string[] = await admin.listTopics();
    return topics.sort();
  } finally {
    await admin.disconnect();
  }
}
