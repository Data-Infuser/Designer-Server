import ApplicationController from "./ApplicationController";
import DatabaseConnectionController from "./DatabaseConnectionController";
import DefaultController from "./DefaultController";
import MetaController from "./MetaController";
import RestContoller from "./rest/RestContoller";
import AuthController from './api/AuthController';

export default [
    new DefaultController(),
    new ApplicationController(new MetaController()),
    new DatabaseConnectionController(),
    new MetaController(),
    new RestContoller(),
    new AuthController()
]
