import { Workflow } from "@/utils/types";
import { sql } from "@ts-safeql/sql-tag";
import { getPool } from "shared";

export async function createWorkflow({
  taskId,
  eventType,
  message,
  createdBy,
}: {
  taskId: string;
  eventType: string;
  message: string;
  createdBy: string;
}): Promise<Workflow> {
  const result = await getPool().query<Workflow>(
    sql`
      INSERT INTO task_workflows (task_id, event_type, message, created_by)
      VALUES (${taskId}::uuid, ${eventType}, ${message}, ${createdBy}::uuid)
      RETURNING id, task_id, event_type, message, created_by, created_at
    `,
  );
  return result.rows[0];
}

export async function listWorkflowsByTaskId(
  taskId: string,
): Promise<Workflow[]> {
  const result = await getPool().query<Workflow>(
    sql`
      SELECT id, task_id, event_type, message, created_by, created_at
      FROM task_workflows
      WHERE task_id = ${taskId}::uuid
      ORDER BY created_at DESC
    `,
  );

  return result.rows;
}

export async function findTaskOwner(
  taskId: string,
): Promise<{ created_by: string } | null> {
  const result = await getPool().query<{ created_by: string }>(
    sql`
      SELECT created_by FROM tasks WHERE id = ${taskId}::uuid
    `,
  );

  return result.rows[0] ?? null;
}
