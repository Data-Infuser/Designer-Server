import ApplicationController from "./ApplicationController";
import DatabaseConnectionController from "./DatabaseConnectionController";
import DefaultController from "./DefaultController";
import MetaController from "./MetaController";
import AuthController from './api/AuthController';
import ApiUserController from './api/ApiUserController';

export default [
    new DefaultController(),
    new ApplicationController(new MetaController()),
    new DatabaseConnectionController(),
    new MetaController()
]
