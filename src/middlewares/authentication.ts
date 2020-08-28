import * as express from "express";
import * as jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import RedisManager from '../util/RedisManager';
import { inRange } from "lodash";
import { InfuserUser } from '../controllers/api/AuthController';

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<InfuserUser> {
  if (securityName === "jwt") {
    const bearerToken =
      request.body.authorization ||
      request.query.authorization ||
      request.headers.authorization;
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
        const user = await RedisManager.Instance.getUser(token);
        if(user) { resolve(user); }
        else { reject(); }
      } catch (err) {
        reject(err);
      }
    });
  }
}