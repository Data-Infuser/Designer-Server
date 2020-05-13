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
import setupRoutes from "./routes/setupRoutes";
import ApplicationError from "./ApplicationError";
import { KongClient } from "./client/KongClient";

export class Application {
  app: express.Application;

  constructor() {
    this.app = express()
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}))
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
    }))
    this.app.use(express.static('./src/public'));

    this.app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: 'long-long-long-secret-string-1313513tefgwdsvbjkvasd'
    }))

    this.app.use(flash());
    this.app.use(function(req, res, next) {
      res.locals.flashMessages = req.flash();
      next();
    });
    
    this.app.use(morgan(":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length]"));
    
  }

  setupDbAndServer = async () => {
      const conn = await createConnection().catch(error => console.log(error));;
      const datasetConn = await createConnection('dataset').catch(error => console.log(error));;
      setupPassport(this.app);
      setupRoutes(this.app);

      this.app.use(function(req, res, next) {
        let err = new ApplicationError(404, 'Not Found');
        next(err)
      });

      this.app.use(function(err, req, res, next) {
        if (res.headersSent) {
          return;
        }

        //admin error의 경우에만 아래와 같이 처리.
        res.render("error.pug", {
            statusCode : err.statusCode,
            message : err.message
        })
      });

      this.startServer()

      await new KongClient().init();
  }

  startServer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.app.listen(3000, () => {
        console.log("Server started on port" + 3000);
        resolve(true);
      })
    });
  }
}