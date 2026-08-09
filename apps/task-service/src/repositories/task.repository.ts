import { Task } from "@/utils/types";
import { sql } from "@ts-safeql/sql-tag";
import { getPool } from "shared";

export async function createTask(input: {
  title: string;
  createdBy: string;
}): Promise<Task> {
  const result = await getPool().query<Task>(
    sql`
      INSERT INTO tasks (title, created_by)
      VALUES (${input.title}, ${input.createdBy}::uuid)
      RETURNING id, title, status, created_by, created_at, updated_at
    `,
  );
  return result.rows[0];
}

export async function listTasks(input: {
  userId: string;
  role: string;
}): Promise<Task[]> {
  if (input.role === "ADMIN") {
    const result = await getPool().query<Task>(
      sql`
        SELECT id, title, status, created_by, created_at, updated_at
        FROM tasks
        ORDER BY created_at DESC
      `,
    );
    return result.rows;
  }
  const result = await getPool().query<Task>(
    sql`
      SELECT id, title, status, created_by, created_at, updated_at
      FROM tasks
      WHERE created_by = ${input.userId}::uuid
      ORDER BY created_at DESC
    `,
  );
  return result.rows;
}

export async function findSingleTaskById(id: string): Promise<Task> {
  const result = await getPool().query<Task>(
    sql`
      SELECT id, title, status, created_by, created_at, updated_at
      FROM tasks
      WHERE id = ${id}::uuid
    `,
  );
  return result.rows[0] ?? null;
}

export async function deleteSingleTaskById(id: string): Promise<Task> {
  const result = await getPool().query<Task>(
    sql`
      DELETE
      FROM tasks
      WHERE id = ${id}::uuid
      RETURNING id, title, status, created_by, created_at, updated_at
    `,
  );
  // return (result.rowCount ?? 0) > 0;
  return result.rows[0] ?? null;
}

export async function updateTaskById(id: string, title: string): Promise<Task> {
  const result = await getPool().query<Task>(
    sql`
      UPDATE tasks
      SET title = ${title}, updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id, title, status, created_by, created_at, updated_at
    `,
  );
  return result.rows[0] ?? null;
}
