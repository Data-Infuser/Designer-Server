import ApplicationController from "./ApplicationController";
import DatabaseConnectionController from "./DatabaseConnectionController";
import DefaultController from "./DefaultController";
import MetaController from "./MetaController";
import ApiApplicationController from "./api/ApplicationContoller";
import AuthController from './AuthController';

export default [
    new DefaultController(),
    new ApplicationController(new MetaController()),
    new DatabaseConnectionController(),
    new MetaController(),
    new ApiApplicationController(),
    new AuthController()
]
