import { Router, Request, Response, NextFunction } from "express";
import ApiDatasetController from "../controllers/ApiDatasetController";

const router = Router();

router.get("/:identifier", ApiDatasetController.getShow);

export default router;