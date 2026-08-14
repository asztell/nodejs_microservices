import { Workflow } from "./types";

export function convertToPublicWorkflow({
  id,
  task_id,
  event_type,
  message,
  created_by,
  created_at,
}: Workflow) {
  return {
    id,
    taskId: task_id,
    eventType: event_type,
    message,
    cratedBy: created_by,
    createdAt: created_at,
  };
}
