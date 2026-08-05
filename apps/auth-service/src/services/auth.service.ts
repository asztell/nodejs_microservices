import { createUser, findByEmail } from "@/repositories/user.repository";
import { RegisterInput } from "@/schemas/auth.schema";
import { AppError } from "shared";
import bcrypt from "bcryptjs";

export async function register(input: RegisterInput) {
  const existing = await findByEmail(input.email);
  if (existing) {
    throw new AppError(409, "email already registered");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "USER",
  });
  return user;
}
