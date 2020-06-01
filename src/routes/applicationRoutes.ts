import { Router } from "express";
import ApplicationController from "../controllers/ApplicationController";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();

router.get("/", needAuth, ApplicationController.getIndex);
router.get("/new", needAuth, ApplicationController.getNew);
router.post("/", needAuth, ApplicationController.post);
router.get("/:id", needAuth, ApplicationController.getShow);
router.get("/:id/apis/new", needAuth, ApplicationController.getApiNew);
router.post("/:id/apis", needAuth, ApplicationController.postApi);
router.get("/:id/apis/:apiId", needAuth, ApplicationController.getApiShow);

export default router;