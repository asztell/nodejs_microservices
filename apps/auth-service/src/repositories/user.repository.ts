import { sql } from "@ts-safeql/sql-tag";
import { User, UserRole } from "@/types/auth.types";
import { getPool } from "shared";

type UserQuery = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
};

export async function createUser({
  name,
  email,
  passwordHash,
  role,
}: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): Promise<UserQuery> {
  const result = await getPool().query<User>(
    sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, ${role ?? "USER"})
      RETURNING id, name, email, password_hash, role, created_at
    `,
  );
  return result.rows[0];
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await getPool().query<User>(
    sql`
      SELECT id, name, email, password_hash, role, created_at
      FROM users
      WHERE email = ${email}
    `,
  );
  return result.rows[0] ?? null;
}

export async function findById(userId: string): Promise<User | null> {
  const result = await getPool().query<User>(
    sql`
      SELECT id, name, email, password_hash, role, created_at
      FROM users
      WHERE id = ${userId}::uuid
    `,
  );
  return result.rows[0] ?? null;
}
