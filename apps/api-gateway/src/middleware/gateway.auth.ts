import { getAllowedRoles, isPublicRoute } from "@/rbac";
import type { Request, Response, NextFunction } from "express";
import { AppError, verifyToken } from "shared";

const IDENTITY_HEADERS = [
  "x-user-id",
  "x-user-role",
  "x-gateway-secret",
] as const;

function stripIdentityHeaders(req: Request) {
  for (const header of IDENTITY_HEADERS) {
    delete req.headers[header];
  }
}

function attachGatewaySecret(req: Request) {
  const secret = process.env.GATEWAY_SECRET;
  console.log("===> env", process.env);
  if (!secret) {
    throw new AppError(500, "GATEWAT_SECRET is not set");
  }
  req.headers["x-gateway-secret"] = secret;
}

function requestPath(req: Request) {
  const combined = `${req.baseUrl}${req.path}`;
  if (combined.length > 1 && combined.endsWith("/")) {
    return combined.slice(0, 1);
  }
  return combined || "/";
}

function attachUserHeaders(req: Request, userId: string, role: string) {
  req.headers["x-user-id"] = userId;
  req.headers["x-user-role"] = role;
}

export function gatewayAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    stripIdentityHeaders(req);

    attachGatewaySecret(req);

    const path = requestPath(req);
    if (isPublicRoute(req.method, path)) {
      return next();
    }

    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Missing or invalid auth token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyToken(token);

    const allowedRoles = getAllowedRoles(req.method, path);
    if (!allowedRoles) {
      throw new AppError(404, "Route not found");
    }
    if (!allowedRoles.includes(payload.role)) {
      throw new AppError(
        403,
        "Forbidden, you do not have access to this route",
      );
    }

    attachUserHeaders(req, payload.userId, payload.role);

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(401, "Invalid or expired token"));
  }
}
