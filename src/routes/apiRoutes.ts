import { Router, Request, Response, NextFunction } from "express";
import DefaultController from "../controllers/DefaultController";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();
router.post("/", needAuth, DefaultController.getLoginPage)

export default router;