import { Router } from "express";
import ApplicationController from "../controllers/ApplicationController";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();

router.get("/", needAuth, ApplicationController.getIndex);
router.get("/new", needAuth, ApplicationController.getNew);
router.post("/", needAuth, ApplicationController.post);

export default router;