import * as grpc from "grpc";
import { LoginReq, AuthResult, AuthRes, RefreshTokenReq } from '../lib/infuser-protobuf/gen/proto/author/auth_pb';
import { AuthServiceClient } from "../lib/infuser-protobuf/gen/proto/author/auth_grpc_pb";
import ApplicationError from '../ApplicationError';

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

  // VALID = 0;
  // NOT_REGISTERED = -1;
  // INVALID_PASSWORD = -2;
  // WITHDRAWAL_USER = -3;
  // INVALID_TOKEN = -4;
  // INTERNAL_EXCEPTION = -9;
  public async login(username: string, password: string):Promise<AuthRes.AsObject>{
    return new Promise( (resolve, reject) => {
      const loginReq = new LoginReq();
      loginReq.setLoginId(username);
      loginReq.setPassword(password);
      this._authClient.login(loginReq, (err: grpc.ServiceError, response:AuthRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getCode() !== AuthResult.VALID) {
          let messageCode = "GLOBAL_0001";
          switch(response.getCode()) {
            case AuthResult.NOT_REGISTERED:
              messageCode = "AUTH_0001";
              break;
            case AuthResult.INVALID_PASSWORD:
              messageCode = "AUTH_0002";
              break;
            case AuthResult.WITHDRAWAL_USER:
              messageCode = "AUTH_0003";
              break;
            case AuthResult.INVALID_TOKEN:
              messageCode = "AUTH_0004";
              break;
            default:
              break;
          }
          reject(new ApplicationError(401, messageCode));
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