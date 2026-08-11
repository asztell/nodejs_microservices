import { CreateTaskInput } from "@/schemas/task.schemas";
import * as taskRepo from "../repositories/task.repository";
import { convertToPublicTask } from "@/utils/task.utils";
import { AppError } from "shared";
import { publishTaskEvent } from "@/kafka";

export async function createTask(input: CreateTaskInput, userId: string) {
  const newTask = await taskRepo.createTask({
    title: input.title,
    createdBy: userId,
  });
  await publishTaskEvent(newTask.id, userId);
  return convertToPublicTask(newTask);
}

export async function listTasks(userId: string, role: string) {
  if (!userId || !role) {
    throw new AppError(401, "Missing user identity");
  }
  const tasks = await taskRepo.listTasks({ userId, role });
  return tasks.map(convertToPublicTask);
}

export async function getSingleTask(
  taskId: string,
  userId: string,
  role: string,
) {
  const task = await taskRepo.findSingleTaskById(taskId);
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  if (role !== "ADMIN" && task.created_by !== userId) {
    throw new AppError(403, "Forbidden");
  }
  return convertToPublicTask(task);
}

export async function deleteTask(taskId: string, role: string) {
  if (role !== "ADMIN") {
    throw new AppError(403, "Forbidden");
  }
  const deleted = await taskRepo.deleteSingleTaskById(taskId);
  if (!deleted) {
    throw new AppError(404, "Task not found");
  }
  return deleted;
}

export async function updateTask(
  taskId: string,
  userId: string,
  role: string,
  title: string,
) {
  const task = await taskRepo.findSingleTaskById(taskId);
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  if (role !== "ADMIN" && task.created_by !== userId) {
    throw new AppError(403, "Forbidden");
  }
  const updated = await taskRepo.updateTaskById(taskId, title);
  return updated;
}
