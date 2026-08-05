import { registerSchema } from "@/schemas/auth.schema";
import { Router } from "express";
import { validateBody } from "shared";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);

export default router;
