import { Router, Request, Response, NextFunction } from "express";
import ApiController from "../controllers/ApiController";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();
router.post("/", needAuth, ApiController.uploadXlsxFile)

export default router;