import { Request, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";

class ApiUserController {

  public path = '/api/users';
  public router = Router();


  constructor() {
    this.initialRoutes();
  }

  public initialRoutes() {
    this.router.get("/me", passport.authenticate('jwt', {session: false}), this.getMe);
  }

  getMe = async(req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(req.user)
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err.message
      })
      return;
    }
  }
}

export default ApiUserController;