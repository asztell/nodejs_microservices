import { DomainEvent } from "@/utils/types";
import { logger, TOPICS, createConsumer, runConsumer, AppError } from "shared";
import * as worflowRepo from "../repositories/workflow.repositories";
import { convertToPublicWorkflow } from "../utils/workflow.utils";

async function handleDomainEvent({
  eventType,
  taskId,
  userId,
  message,
}: DomainEvent) {
  if (!eventType || !taskId || !userId) {
    logger.warn({ eventType, taskId, userId }, "invalid domain event");
    return;
  }
  const workflow = await worflowRepo.createWorkflow({
    taskId,
    eventType,
    message: message || eventType,
    createdBy: userId,
  });
  logger.info(
    {
      workflowId: workflow.id,
      eventType: workflow.event_type,
      message: workflow.message,
      createdBy: workflow.created_by,
      createdAt: workflow.created_at,
    },
    "workflow row created",
  );
}

export async function startKafka() {
  const consumer = await createConsumer(
    "workflow-service",
    "workflow-service-group",
  );
  runConsumer(
    consumer,
    [TOPICS.TASK_EVENTS, TOPICS.MEDIA_EVENTS],
    async ({ message }) => {
      const value = message.value?.toString();
      if (!value) return;
      try {
        await handleDomainEvent(JSON.parse(value) as DomainEvent);
      } catch (err) {
        logger.error({ err }, "workflow consumer failed");
      }
    },
  );
}

export async function listWorkflowsByTask(
  taskId: string,
  userId: string,
  role: string,
) {
  const task = await worflowRepo.findTaskOwner(taskId);
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  // logger.info({})
  if (role !== "ADMIN" && task.created_by !== userId) {
    throw new AppError(403, "forbidden");
  }
  const rows = await worflowRepo.listWorkflowsByTaskId(taskId);
  return rows.map(convertToPublicWorkflow);
}
