import { AppError } from "shared";
import * as mediaRepo from "../repositories/media.repository";
import { uploadBuffer } from "@/utils/storage";
import { convertToPublicAttachment } from "@/utils/media.utils";

async function assertTaskAccess(taskId: string, userId: string, role: string) {
  const task = await mediaRepo.findTaskAccess(taskId);
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  if (role !== "ADMIN" && task.created_by !== userId) {
    throw new AppError(403, "Forbidden");
  }
}

export async function uploadAttachment(input: {
  taskId: string;
  userId: string;
  role: string;
  file?: Express.Multer.File;
}) {
  if (!input.file) {
    throw new AppError(400, "Image file is required");
  }
  await assertTaskAccess(input.taskId, input.userId, input.role);
  const uploaded = await uploadBuffer(
    input.file.buffer,
    input.file.mimetype || "image/jpeg",
  );
  const attachment = await mediaRepo.createAttachment({
    taskId: input.taskId,
    imageUrl: uploaded.imageUrl,
    publicId: uploaded.publicId,
    uploadedBy: input.userId,
  });
  return convertToPublicAttachment(attachment);
}

export async function getAttachments(
  taskId: string,
  userId: string,
  role: string,
) {
  await assertTaskAccess(taskId, userId, role);
  const rows = await mediaRepo.getImageByTaskId(taskId);
  return rows.map(convertToPublicAttachment);
}
