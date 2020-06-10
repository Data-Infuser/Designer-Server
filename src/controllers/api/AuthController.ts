import { Request, Response, NextFunction, Router } from "express";
import { getRepository } from "typeorm";
import { User } from "../../entity/manager/User";
import { generateTokens, refreshTokens } from '../../util/JwtManager';

class AuthController {

  public path = '/api/oauth';
  public router = Router();

  constructor() {
    this.initialRoutes();
  }

  public initialRoutes() {
    this.router.post("/login", this.loginByPassword)
    this.router.post("/token", this.refreshToken)
  }
  
  loginByPassword = async(req: Request, res: Response) => {
    const { username, password } = req.body;
    const userRepo = getRepository(User);
    try {
      const currentUser = await userRepo.findOne({username: username})
      if (!currentUser || !currentUser.checkIfUnencryptedPasswordIsValid(password)) {
        res.status(501).json({
          message: "invalid user info"
        })
      }
      const tokrens = generateTokens(currentUser);
      res.status(200).json(tokrens)
    } catch (err) {
      console.error(err);
      res.status(501).json({
        message: "invalid user info"
      })
    }
    
  }

  refreshToken = async(req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    try {
      const tokens = refreshTokens(refreshToken)
      res.status(200).json(tokens)
    } catch (err) {
      console.error(err);
      res.status(501).json({
        message: "invalid user info"
      })
    }
  }
}

export default AuthController;