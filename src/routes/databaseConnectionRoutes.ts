import { Router, Request, Response, NextFunction } from "express";
import DatabaseConnectionController from "../controllers/DatabaseConnectionController";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";

const router = Router();

router.get("/", needAuth, DatabaseConnectionController.getIndex);
router.get("/new", needAuth, DatabaseConnectionController.getNew);
router.post("/", needAuth, DatabaseConnectionController.post);
export default router;