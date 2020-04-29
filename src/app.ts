import * as express from "express";
import * as bodyParser from "body-parser";
import * as methodOverride from "method-override";
import defaultRoutes from "./routes/defaultRoutes"
import * as compileSass from "express-compile-sass";
import * as path from "path";
import setupPassport from "./config/passportConfig";
import * as session from "express-session";
import * as morgan from "morgan";
import * as flash from "connect-flash";
import {createConnection} from "typeorm";


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
        this.app.use(flash());

        this.app.use(session({
            resave: true,
            saveUninitialized: true,
            secret: 'long-long-long-secret-string-1313513tefgwdsvbjkvasd'
        }))
        this.app.use(morgan(":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length]"));
        
    }

    setupDbAndServer = async () => {
        const conn = await createConnection().catch(error => console.log(error));;
        setupPassport(this.app);
        this.app.use("/", defaultRoutes);
        this.startServer()
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