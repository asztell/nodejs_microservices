import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export function requireGatewaySecret(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const expected = process.env.GATEWAY_SECRET;
  if (!expected) {
    return next(new AppError(500, "GATEWAY_SECRET is not configured"));
  }
  const incoming = req.header("x-gateway-secret");
  if (!incoming || incoming !== expected) {
    return next(new AppError(403, "Forbidden"));
  }
  next();
}
