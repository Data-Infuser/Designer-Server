import express, {
  Response as ExResponse,
  Request as ExRequest,
  NextFunction,
} from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import session from "express-session";
import morgan from "morgan";
import flash from "express-flash";
import {createConnection, ConnectionOptions} from "typeorm";
import ApplicationError from "./ApplicationError";
import cors from "cors";
import { RegisterRoutes } from './routes/routes';
import swaggerUi from "swagger-ui-express";
import BullManager from "./util/BullManager";
import * as grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";
import setupApplications from "./grpc/applications";
import swagger from './routes/swagger.json';
import ormConfig from "./config/ormConfig";
import { ValidateError } from "tsoa";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import RedisManager from "./util/RedisManager";

const property = require("../property.json")

export class Application {
  app: express.Application;
  server;
  grpcServer;
  auth;
  constructor() {
    this.app = express();
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    this.app.use(methodOverride('_method'));
    this.app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: 'long-long-long-secret-string-1313513tefgwdsvbjkvasd'
    }));

    this.app.use(flash());
    this.app.use(function(req, res, next) {
      res.locals.flashMessages = req.flash();
      next();
    });

    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan(":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] :response-time ms"));
    }
  }

  setupDbAndServer = async () => {
    let connectionInfo = {
      ...ormConfig.defaultConnection
    }

    if(process.env.NODE_ENV !== 'production') {
      connectionInfo = ormConfig.defaultConnection = {
        ...ormConfig.defaultConnection,
        database: "designer-test"
      }
    }

    await createConnection(connectionInfo)
    await createConnection(ormConfig.datasetConnection)

    await RedisManager.Instance.connect();

    RegisterRoutes(<express.Express>this.app);
    BullManager.setupBull(this.app);

    this.app.use("/api-docs", swaggerUi.serve, async (_req: express.Request, res: express.Response) => {
      return res.send(
        swaggerUi.generateHTML(swagger)
      );
    });

    this.app.use(function(req, res, next) {
      let err = new ApplicationError(404, 'Not Found');
      next(err);
    });

    this.app.use(function errorHandler(
      err: unknown,
      req: ExRequest,
      res: ExResponse,
      next: NextFunction
    ): ExResponse | void {
      console.log(err);

      if (err instanceof JsonWebTokenError) {
        return res.status(401).json({
          message: "Token expired"
        })
      }
      // console.log(err)

      if (err instanceof ValidateError) {
        return res.status(422).json({
          message: "Validation Failed",
          details: err?.fields,
        });
      }

      if (err instanceof Error) {
        if(err.name === "ApplicationError") {
          const applicationError = <ApplicationError> err;
          return res.status(applicationError.statusCode).json({
            code: applicationError.message
          });
        }
        return res.status(500).json({
          message: "Internal Server Error",
        });
      }

      next();
    });

    await this.startServer();
    this.setupGrpcServer();
  }

  setupGrpcServer() {
    this.grpcServer = new grpc.Server();
    setupApplications(this.grpcServer);
    this.grpcServer.bind(`0.0.0.0:${property.grpcPort}`, grpc.ServerCredentials.createInsecure());
    this.grpcServer.start();
  }

  startServer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(property.port, () => {
        resolve(true);
      });
    });
  }
}