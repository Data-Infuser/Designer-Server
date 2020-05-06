import { Router, Request, Response, NextFunction } from "express";
import ApiController from "../controllers/ApiController";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();
router.post("/", needAuth, ApiController.uploadXlsxFile);
router.get("/", needAuth, ApiController.getIndex);
router.get("/new", needAuth, ApiController.getNew);

export default router;