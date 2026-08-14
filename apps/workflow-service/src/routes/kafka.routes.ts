// Location: apps/workflow-service/src/routes/kafka.routes.ts
import { Router } from "express";
import {
  getUserTopicSnapshotHandler,
  getTopicsListHandler,
} from "../controllers/kafka.controllers";

const router = Router();

router.get("/snapshot/:topicName", getUserTopicSnapshotHandler);
router.get("/topics", getTopicsListHandler);

export default router;
