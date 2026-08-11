import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import * as mediaController from "../controllers/media.controllers";
import { uploadImage } from "@/middleware/upload.middleware";
import { AppError } from "shared";

const router = Router();

function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadImage(req, res, (error: unknown) => {
    if (!error) {
      return next();
    }
    if (error instanceof AppError) {
      return next(error);
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return next(new AppError(400, "Image must be 10mb or smaller"));
    }
    return next(new AppError(400, "Invalid image upload"));
  });
}

router.post(
  "/:taskId/attachments",
  handleUpload,
  mediaController.uploadAttachment,
);

router.get("/:taskId/attachments", mediaController.getAttachments);

export default router;
