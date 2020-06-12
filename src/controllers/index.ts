import ApplicationController from "./ApplicationController";
import DatabaseConnectionController from "./DatabaseConnectionController";
import DefaultController from "./DefaultController";
import MetaController from "./MetaController";
import RestContoller from "./rest/RestContoller";
import AuthController from './api/AuthController';
import ApiUserController from './api/ApiUserController';

export default [
    new DefaultController(),
    new ApplicationController(new MetaController()),
    new DatabaseConnectionController(),
    new MetaController(),
    new RestContoller()
]
