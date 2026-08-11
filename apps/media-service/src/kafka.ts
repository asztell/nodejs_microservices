import { createProducer, publishJSONSafely, TOPICS } from "shared";

let producer: Awaited<ReturnType<typeof createProducer>> | null = null;

export async function initKafka() {
  producer = await createProducer("media-service");
}

export async function publishAttachmentEvent(taskId: string, userId: string) {
  await publishJSONSafely(
    producer,
    TOPICS.MEDIA_EVENTS,
    {
      eventType: "attachment.uploaded",
      taskId,
      userId,
      message: "Attachment uploaded successfully",
      timestamp: new Date().toISOString(),
    },
    taskId,
  );
}
