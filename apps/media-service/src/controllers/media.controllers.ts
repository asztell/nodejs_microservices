import type { Request, Response, NextFunction } from "express";
import { AppError, successResponse } from "shared";
import * as mediaService from "../services/media.service";

function requireIdentity(req: Request) {
  const userId = req.header("x-user-id");
  const role = req.header("x-user-role");
  if (!role || !userId) {
    throw new AppError(401, "Missing user identity");
  }
  return { userId, role };
}

export async function uploadAttachment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, role } = requireIdentity(req);
    const taskId = String(req.params.taskId);
    const attachment = await mediaService.uploadAttachment({
      taskId,
      userId,
      role,
      file: req.file,
    });
    successResponse(res, { attachment }, 201);
  } catch (error) {
    next(error);
  }
}

export async function getAttachments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, role } = requireIdentity(req);
    const taskId = String(req.params.taskId);
    const attachments = await mediaService.getAttachments(taskId, userId, role);
    successResponse(res, { attachments });
  } catch (error) {
    next(error);
  }
}
