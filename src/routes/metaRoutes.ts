import { Router, Request, Response, NextFunction } from "express";
import MetaController from "../controllers/MetaController";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();

router.post("/", needAuth, MetaController.uploadXlsxFile);
router.get("/", needAuth, MetaController.getIndex);
router.get("/new", needAuth, MetaController.getNew);
router.get("/:id", needAuth, MetaController.getShow);
router.get("/:id/edit", needAuth, MetaController.getEdit);
router.put("/:id", needAuth, MetaController.put);
router.delete("/:id", needAuth, MetaController.delete);

router.post("/:id/apis", needAuth, MetaController.postNewApi);
router.get("/:id/apis/new", needAuth, MetaController.getNewApi);



export default router;