import { Router, Request, Response, NextFunction } from "express";
import ApiApplicationContoller from "../controllers/api/ApplicationContoller";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();

router.get("/applications", ApiApplicationContoller.getApplications);

export default router;