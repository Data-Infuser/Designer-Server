import { Router, Request, Response, NextFunction } from "express";
import MetaController from "../controllers/MetaController";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();

router.get("/:id/edit", needAuth, MetaController.getEdit);
router.put("/:id", needAuth, MetaController.put);
router.delete("/:id", needAuth, MetaController.delete);

export default router;