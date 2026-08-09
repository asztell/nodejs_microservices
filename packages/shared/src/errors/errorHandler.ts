import { Request, Response } from "express";
import { AppError } from "./AppError.js";

export function errorHandler(err: unknown, _req: Request, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  return res.status(500).json({
    soccess: false,
    message: "Internal server error",
  });
}
