import * as grpc from "grpc";
import { LoginReq, AuthResult, AuthRes, RefreshTokenReq } from '../lib/infuser-protobuf/gen/proto/author/auth_pb';
import { AuthServiceClient } from "../lib/infuser-protobuf/gen/proto/author/auth_grpc_pb";
import ApplicationError from '../ApplicationError';
import { resolve } from 'url';

const property = require("../../property.json");

class InfuserGrpcAuthorClient {
  private static _instance: InfuserGrpcAuthorClient;

  private _authClient: AuthServiceClient;

  constructor() {
    const server = `${property.grpc.auth.host}:${property.grpc.auth.port}`
    const secure = grpc.credentials.createInsecure()
    this._authClient = new AuthServiceClient(server, secure);
  }

  public static get Instance() {
    if(!InfuserGrpcAuthorClient._instance) InfuserGrpcAuthorClient._instance = new InfuserGrpcAuthorClient();
    return this._instance;
  }

  public async login(username: string, password: string):Promise<AuthRes.AsObject>{
    return new Promise( (resolve, reject) => {
      const loginReq = new LoginReq();
      loginReq.setLoginId(username);
      loginReq.setPassword(password);
      this._authClient.login(loginReq, (err: grpc.ServiceError, response:AuthRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getCode() !== AuthResult.VALID) {
          reject(new ApplicationError(401, response.getMsg()));
        }
        resolve(response.toObject());
      })
    })
  }

  public async refresh(refreshToken: string): Promise<AuthRes.AsObject> {
    return new Promise( (resolve, reject) => {
      const refreshReq: RefreshTokenReq = new RefreshTokenReq();
      refreshReq.setRefreshToken(refreshToken);
      this._authClient.refresh(refreshReq, (err: grpc.ServiceError, response: AuthRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getCode() !== AuthResult.VALID) {
          reject(new ApplicationError(401, response.getMsg()));
        }
        resolve(response.toObject());
      })
    })
  }
}

export default InfuserGrpcAuthorClient;