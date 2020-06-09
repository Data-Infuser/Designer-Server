import { Request, Response, NextFunction, Router } from "express";
import { getRepository } from "typeorm";
import { User } from "../entity/manager/User";
import jwt from "jsonwebtoken";

const TOKEN_SECRET = "json-oauth-token"
const REFRESH_TOKEN_SECRET = "json-oauth-refresth-token"

interface TokenInterface {
  username: string,
  id: number,
  iat: number,
  exp: number
}
class AuthController {

  public path = '/oauth';
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
      console.log(currentUser);

      const payloadUserInfo = {
        id: currentUser.id,
        username: currentUser.username
      }
      const token = jwt.sign(payloadUserInfo, TOKEN_SECRET, { expiresIn: "2d" })
      const refreshToken =  jwt.sign(payloadUserInfo, REFRESH_TOKEN_SECRET, { expiresIn: "30d" })

      res.status(200).json({
        "token": token,
        "refreshToken": refreshToken
      })
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
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      const id = (<TokenInterface>decoded).id;
      const username = (<TokenInterface>decoded).username;

      const payloadUserInfo = {
        id: id,
        username: username
      }

      const token = jwt.sign(payloadUserInfo, TOKEN_SECRET, { expiresIn: "2d" })
      const newRefreshToken =  jwt.sign(payloadUserInfo, REFRESH_TOKEN_SECRET, { expiresIn: "30d" })

      res.status(200).json({
        "token": token,
        "refreshToken": newRefreshToken
      })
    } catch (err) {
      console.error(err);
      res.status(501).json({
        message: "invalid user info"
      })
    }
  }
}

export default AuthController;