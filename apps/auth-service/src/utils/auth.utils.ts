import { User } from "@/types/auth.types";

export function convertToPublicUser({ created_at, ...user }: User) {
  return {
    ...user,
    createdAt: created_at,
  };
}
