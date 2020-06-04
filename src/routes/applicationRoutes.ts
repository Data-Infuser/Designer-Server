import { Router } from "express";
import ApplicationController from "../controllers/ApplicationController";
import MetaController from "../controllers/MetaController";
import { needAuth } from "../middlewares/checkAuth";
import { Meta } from "../entity/manager/Meta";
import swagger from "swagger-ui-express";



const router = Router();

//Applications
router.get("/", needAuth, ApplicationController.getIndex);
router.get("/new", needAuth, ApplicationController.getNew);
router.post("/", needAuth, ApplicationController.post);
router.get("/:id", needAuth, ApplicationController.getShow);
router.post("/:id/deploy", needAuth, ApplicationController.deployApplication);
router.use("/:id/api-docs", swagger.serve);
router.get("/:id/api-docs", swagger.serve, ApplicationController.getApiDocs);
//Apis
router.get("/:id/apis/new", needAuth, ApplicationController.getApiNew);
router.post("/:id/apis", needAuth, ApplicationController.postApi);
router.get("/:id/apis/:apiId", needAuth, ApplicationController.getApiShow);
router.put("/:id/apis/:apiId", needAuth, ApplicationController.putApi);
router.get("/:id/apis/:apiId/edit", needAuth, ApplicationController.getApiEdit);
//Metas
router.get("/:id/apis/:apiId/meta/new", needAuth, MetaController.getNew);
router.post("/:id/apis/:apiId/meta", needAuth, MetaController.postMetaMultipart);

export default router;