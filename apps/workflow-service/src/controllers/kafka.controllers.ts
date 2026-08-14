import type { Request, Response } from "express";
import { Kafka } from "kafkajs";
import {
  createKafkaClient,
  fetchAllTopicMessages,
  fetchAllActiveTopics,
} from "shared";

interface UserCreatedPayload {
  userId: string;
  // email: string;
  // accountStatus: "active" | "pending" | "suspended";
  createdAt: string;
}

interface TopicRequestParams {
  topicName: string;
}

// module-level cache to hold the active client instance (Singleton Pattern)
let cachedKafkaClient: Kafka | null = null;

export async function getUserTopicSnapshotHandler(
  req: Request<TopicRequestParams>,
  res: Response,
): Promise<Response> {
  const { topicName } = req.params;
  const clientId = "kafka-snapshot-service";

  try {
    if (!cachedKafkaClient) {
      cachedKafkaClient = createKafkaClient(clientId);
    }
    const messages = await fetchAllTopicMessages<UserCreatedPayload>({
      // const messages = await fetchAllTopicMessages({
      kafkaInstance: cachedKafkaClient,
      topicName: topicName,
      timeoutMs: 8000,
    });

    return res.status(200).json({
      success: true,
      topic: topicName,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown processing error";
    return res.status(500).json({ success: false, error: errorMessage });
  }
}

export async function getTopicsListHandler(
  _req: Request,
  res: Response,
): Promise<Response> {
  const clientId = "kafka-snapshot-service";

  try {
    if (!cachedKafkaClient) {
      cachedKafkaClient = createKafkaClient(clientId);
    }
    const topics: string[] = await fetchAllActiveTopics({
      kafkaInstance: cachedKafkaClient,
    });

    return res.status(200).json({
      success: true,
      count: topics.length,
      data: topics.filter((topic) => !topic.startsWith("__")).sort(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown administrative error";
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
