import { Request, Response, NextFunction, response } from "express";
import { Api } from "../entity/manager/Api";
import { getRepository, getConnection, getManager } from "typeorm";
import ApplicationError from "../ApplicationError";
import { Meta } from "../entity/manager/Meta";
import { DatabaseConnection } from "../entity/manager/DatabaseConnection";
import { request } from "http";
import { User } from "../entity/manager/User";

class ConnectionController {
  static getIndex = async(req: Request, res: Response, next: NextFunction) => {
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

  static getNew = async(req: Request, res: Response, next: NextFunction) => {
    res.render("databaseConnections/new.pug", {
      current_user: req.user
    })
  }

  static post = async(req: Request, res: Response, next: NextFunction) => {
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
}

export default ConnectionController;