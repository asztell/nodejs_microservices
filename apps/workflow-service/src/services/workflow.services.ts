import { DomainEvent } from "@/utils/types";
import {
  logger,
  TOPICS,
  createConsumer,
  createProducer,
  runConsumer,
  AppError,
} from "shared";
import * as worflowRepo from "../repositories/workflow.repositories";
import { convertToPublicWorkflow } from "../utils/workflow.utils";

// Module-level references for graceful shutdown lifecycle
let consumerInstance: Awaited<ReturnType<typeof createConsumer>> | null = null;
let localDlqProducer: Awaited<ReturnType<typeof createProducer>> | null = null;

async function handleDomainEvent({
  eventType,
  taskId,
  userId,
  message,
}: DomainEvent) {
  if (!eventType || !taskId || !userId) {
    const error = new Error(
      "Invalid domain event: Missing required validation properties",
    );
    error.name = "ValidationError"; // flag this name as an immediate DLQ route
    throw error;
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
    "Workflow row created",
  );
}

export async function startKafka() {
  // Initialize a local workflow-service producer to manage outbound DLQ routing
  localDlqProducer = await createProducer("workflow-service-dlq");

  consumerInstance = await createConsumer(
    "workflow-service",
    "workflow-service-group",
  );

  await runConsumer(
    consumerInstance,
    [TOPICS.TASK_EVENTS, TOPICS.MEDIA_EVENTS],
    async ({ message }) => {
      const value = message.value?.toString();
      if (!value) return;
      await handleDomainEvent(JSON.parse(value) as DomainEvent);
    },
    {
      maxRetries: 3,
      dlqProducer: localDlqProducer,
    },
  );
}

export async function shutdownWorkflowKafka() {
  logger.warn("Stopping Workflow service Kafka links cleanly...");
  if (consumerInstance) {
    await consumerInstance.disconnect();
    logger.info("Workflow consumer offline.");
  }
  if (localDlqProducer) {
    await localDlqProducer.disconnect();
    logger.info("Workflow local DLQ producer offline.");
  }
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
  if (role !== "ADMIN" && task.created_by !== userId) {
    throw new AppError(403, "Forbidden");
  }
  const rows = await worflowRepo.listWorkflowsByTaskId(taskId);
  return rows.map(convertToPublicWorkflow);
}
