import { Request, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import ApplicationError from "../ApplicationError";
import { DatabaseConnection } from "../entity/manager/DatabaseConnection";
import { User } from "../entity/manager/User";
import { MysqlHelper } from "../helpers/MysqlHelper";
import { needAuth } from "../middlewares/checkAuth";

class ConnectionController {

  public path = '/databaseConnections';
  public router = Router();


  constructor() {
    this.initialRoutes();
  }

  public initialRoutes() {
    this.router.get("/", needAuth, this.getIndex);
    this.router.get("/new", needAuth, this.getNew);
    this.router.get("/:id", needAuth, this.getShow);
    this.router.get("/:id/tables/:table", needAuth, this.getTableDetail);
    this.router.post("/", needAuth, this.post);
    this.router.delete("/:id", needAuth, this.delete);
  }

  getIndex = async(req: Request, res: Response, next: NextFunction) => {
    const dbcRepo = getRepository(DatabaseConnection);
    try {
      const dbcs = await dbcRepo.find();
      res.render("databaseConnections/index.pug", {
        dbcs: dbcs,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  getNew = async(req: Request, res: Response, next: NextFunction) => {
    res.render("databaseConnections/new.pug", {
      current_user: req.user
    })
  }
  
  getShow = async(req: Request, res: Response, next: NextFunction) => {
    const dbcRepo = getRepository(DatabaseConnection);
    const { id } = req.params;

    try {
      const dbc = await dbcRepo.findOneOrFail(id);
      const connectOption:ConnectionOptions = {
        name: "mysqlTempConnection",
        type: "mysql",
        host: dbc.hostname,
        port: Number(dbc.port),
        username: dbc.username,
        password: dbc.password,
        database: dbc.database
      }
      const tables = await MysqlHelper.showTables(connectOption);
      const tableStatuses = await MysqlHelper.showTableStatus(connectOption);
      res.render("databaseConnections/show.pug", {
        current_user: req.user,
        tables: tables,
        tableStatuses: tableStatuses,
        dbc: dbc
      })
    } catch(err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
    }
  }

  getTableDetail = async(req: Request, res: Response, next: NextFunction) => {
    const dbcRepo = getRepository(DatabaseConnection);
    const { id, table } = req.params;

    try {
      const dbc = await dbcRepo.findOneOrFail(id);
      const connectOption:ConnectionOptions = {
        name: "mysqlTempConnection",
        type: "mysql",
        host: dbc.hostname,
        port: Number(dbc.port),
        username: dbc.username,
        password: dbc.password,
        database: dbc.database
      }
      const columns = await MysqlHelper.getColumns(connectOption, table);
      res.render("databaseConnections/tables/show.pug", {
        current_user: req.user,
        columns: columns,
        dbc: dbc,
        table: table
      })
    } catch(err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
    }
  }

  post = async(req: Request, res: Response, next: NextFunction) => {
    const dbcRepo = getRepository(DatabaseConnection);
    const { title, host, port, db, user, pwd, dbms } = req.body;

    try {
      const newConnection = new DatabaseConnection();
      newConnection.connectionName = title;
      newConnection.hostname = host;
      newConnection.port = port;
      newConnection.database = db;
      newConnection.username = user;
      newConnection.password = pwd ? pwd : "";
      newConnection.dbms = dbms;
      newConnection.user = <User>req.user;
      await dbcRepo.save(newConnection);

      res.redirect('/databaseConnections')
    } catch(err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
    }
  }

  delete = async(req: Request, res: Response, next: NextFunction) => {
    const dbcRepo = getRepository(DatabaseConnection);
    const { id } = req.params

    try {
      await dbcRepo.delete(id);
      res.redirect('/databaseConnections');
    } catch(err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
    }
  }

}

export default ConnectionController;