import { Attachment } from "@/utils/types";
import { sql } from "@ts-safeql/sql-tag";
import { getPool } from "shared";

export async function findTaskAccess(taskId: string): Promise<{
  id: string;
  created_by: string;
} | null> {
  const result = await getPool().query<{
    id: string;
    created_by: string;
  }>(
    sql`
      SELECT id, created_by
      FROM tasks
      WHERE id = ${taskId}::uuid
    `,
  );
  return result.rows[0] ?? null;
}

export async function createAttachment(input: {
  taskId: string;
  imageUrl: string;
  publicId: string;
  uploadedBy: string;
}): Promise<Attachment> {
  const { taskId, imageUrl, publicId, uploadedBy } = input;
  const result = await getPool().query<Attachment>(
    sql`
      INSERT INTO attachments (task_id, image_url, public_id, uploaded_by)
      VALUES (${taskId}::uuid, ${imageUrl}, ${publicId}, ${uploadedBy}::uuid)
      RETURNING id, task_id, image_url, public_id, uploaded_by, created_at
    `,
  );
  return result.rows[0];
}

export async function getImageByTaskId(taskId: string): Promise<Attachment[]> {
  const result = await getPool().query<Attachment>(
    sql`
      SELECT id, task_id, image_url, public_id, uploaded_by, created_at
      FROM attachments
      WHERE task_id = ${taskId}::uuid
      ORDER BY created_at DESC
    `,
  );
  return result.rows;
}
