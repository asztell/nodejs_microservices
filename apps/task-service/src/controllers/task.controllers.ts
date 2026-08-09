import type { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.services";
import { AppError, successResponse } from "shared";

function requireIdentity(req: Request) {
  const userId = req.header("x-user-id");
  const role = req.header("x-user-role");
  if (!role || !userId) {
    throw new AppError(401, "Missing user identity");
  }
  return { userId, role };
}

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = requireIdentity(req);
    const task = await taskService.createTask(req.body, userId);
    successResponse(res, { task }, 201);
  } catch (error) {
    next(error);
  }
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, role } = requireIdentity(req);
    const tasks = await taskService.listTasks(userId, role);
    successResponse(res, { tasks });
  } catch (error) {
    next(error);
  }
}

export async function getSingleTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, role } = requireIdentity(req);
    const taskId = String(req.params.taskId);
    const task = await taskService.getSingleTask(taskId, userId, role);
    successResponse(res, { task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { role } = requireIdentity(req);
    const taskId = String(req.params.taskId);
    const task = await taskService.deleteTask(taskId, role);
    successResponse(res, { task });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, role } = requireIdentity(req);
    const taskId = String(req.params.taskId);
    const task = await taskService.updateTask(
      taskId,
      userId,
      role,
      req.body.title,
    );
    successResponse(res, { task });
  } catch (error) {
    next(error);
  }
}
