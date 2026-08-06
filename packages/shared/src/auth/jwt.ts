import jwt from "jsonwebtoken";
import { JwtPayload } from "./types";

function extractJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN;
  return jwt.sign(payload, extractJwtSecret(), {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decodeToken = jwt.verify(token, extractJwtSecret());
  if (
    typeof decodeToken !== "object" ||
    decodeToken === null ||
    typeof decodeToken.userId !== "string" ||
    (decodeToken.role !== "USER" && decodeToken.role !== "ADMIN")
  ) {
    throw new Error("Invalid payload token");
  }
  return {
    userId: decodeToken.userId,
    role: decodeToken.role,
  };
}
