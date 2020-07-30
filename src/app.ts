import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import compileSass from "express-compile-sass";
import path from "path";
import setupPassport from "./config/passportConfig";
import session from "express-session";
import morgan from "morgan";
import flash from "express-flash";
import {createConnection} from "typeorm";
import ApplicationError from "./ApplicationError";
import cors from "cors";
import { RegisterRoutes } from './routes/routes';
import swaggerUi from "swagger-ui-express";
import BullManager from "./util/BullManager";
import * as grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";
import setupUsers from "./grpc/users";
import setupApplications from "./grpc/applications";
export class Application {
  app: express.Application;
  grpcServer;
  auth;
  constructor() {
    this.app = express();
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    this.app.use(methodOverride('_method'));
    this.app.set('view engine', 'pug');
    this.app.set('views', './src/views');
    this.app.use('/js', express.static(path.join(__dirname,'/../',  'node_modules', 'bootstrap', 'dist', 'js')));
    this.app.use('/css', express.static(path.join(__dirname,'/../', 'node_modules', 'bootstrap', 'dist', 'css')));
    this.app.use(compileSass({root: './src/public',
      sourceMap: true,
      sourceComments: true,
      watchFiles: true,
      logToConsole: false
    }));
    this.app.use(express.static('./src/public'));

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
    
    this.app.use(morgan(":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] :response-time ms"));
  }

  setupDbAndServer = async () => {
      const conn = await createConnection().catch(error => console.log(error));
      const datasetConn = await createConnection('dataset').catch(error => console.log(error));

      setupPassport(this.app);
      // await setupRoutes(this.app);
      RegisterRoutes(<express.Express>this.app);
      BullManager.setupBull(this.app);

      this.app.use("/api-docs", swaggerUi.serve, async (_req: express.Request, res: express.Response) => {
        return res.send(
          swaggerUi.generateHTML(await import("./routes/swagger.json"))
        );
      });

      this.app.use(function(req, res, next) {
        let err = new ApplicationError(404, 'Not Found');
        next(err);
      });

      this.app.use(function(err, req, res, next) {
        if (res.headersSent) {
          return;
        }
        console.error(err);
        res.status(err.status||err.statusCode).json(err);
      });

      this.startServer();
      this.setupGrpcServer();
  }

  setupGrpcServer() {
    this.grpcServer = new grpc.Server();
    setupUsers(this.grpcServer);
    setupApplications(this.grpcServer);
    this.grpcServer.bind("127.0.0.1:50001", grpc.ServerCredentials.createInsecure());
    this.grpcServer.start();
  }

  startServer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.app.listen(3000, () => {
        console.log("Server started on port: " + 3000);
        resolve(true);
      });
    });
  }
}