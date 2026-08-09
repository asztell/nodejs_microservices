import { Router } from "express";
import { validateBody } from "shared";
import { createTaskSchema } from "@/schemas/task.schemas";
import * as taskController from "../controllers/task.controllers";

const router = Router();

router.post("/", validateBody(createTaskSchema), taskController.createTask);
router.get("/", taskController.listTasks);
router.get("/:taskId", taskController.getSingleTask);
router.delete("/:taskId", taskController.deleteTask);
router.patch("/:taskId", taskController.updateTask);

export default router;
