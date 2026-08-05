import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.email("email is required"),
  password: z.string().min(6, "password is required"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("email is required"),
  password: z.string().min(6, "password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
