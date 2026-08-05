import { User, UserRole } from "@/types/auth.types";
import { getPool } from "shared";

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
}): Promise<User> {
  const result = await getPool().query<User>(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, password_hash, role, created_at
    `,
    [name, email, passwordHash, role ?? "USER"],
  );
  return result.rows[0];
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await getPool().query<User>(
    `
      SELECT id, name, email, password_hash, role, created_at
      FROM users
      WHERE email = $1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}
