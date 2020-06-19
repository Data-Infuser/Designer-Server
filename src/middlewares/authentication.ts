import * as express from "express";
import * as jwt from "jsonwebtoken";
import { getSecret, getUserFromToken } from "../util/JwtManager";
import { User } from "../entity/manager/User";
import { getRepository } from "typeorm";

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<User> {
  console.log(request.headers);
  if (securityName === "jwt") {
    const bearerToken =
      request.body.authorization ||
      request.query.authorization ||
      request.headers.authorization;
    const userRepo = getRepository(User);
    return new Promise(async (resolve, reject) => {
      try {
        if (!bearerToken) {
          reject(new Error("No token provided"));
          return;
        }
  
        const tokens = bearerToken.split(" ");
        if(tokens.length != 2 || tokens[0] != "Bearer") {
          reject(new Error("Wrong Token Format"));
          return;
        }
        const token = tokens[1]
        const userJson = getUserFromToken(token);
        const user = await userRepo.findOne(userJson.id);
        resolve(user);
      } catch (err) {
        reject(err);
      }
    });
  }
}