import * as grpc from "grpc";
import { LoginReq, AuthResult, AuthRes, RefreshTokenReq } from '../lib/infuser-protobuf/gen/proto/author/auth_pb';
import { AuthServiceClient } from "../lib/infuser-protobuf/gen/proto/author/auth_grpc_pb";
import ApplicationError from '../ApplicationError';
import { UserReq, UserRes } from '../lib/infuser-protobuf/gen/proto/author/user_pb';
import { UserServiceClient } from "../lib/infuser-protobuf/gen/proto/author/user_grpc_pb";
import { ERROR_CODE } from '../util/ErrorCodes';
import { RegistParams } from "../controllers/api/AuthController";
import property from "../config/propertyConfig";

class InfuserGrpcAuthorClient {
  private static _instance: InfuserGrpcAuthorClient;

  private _authClient: AuthServiceClient;
  private _userClient: UserServiceClient;

  constructor() {
    const server = `${property.auth.host}:${property.auth.grpcPort}`
    this._authClient = new AuthServiceClient(server, grpc.credentials.createInsecure());
    this._userClient = new UserServiceClient(server, grpc.credentials.createInsecure());
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
          let messageCode = ERROR_CODE.AUTH[response.getCode()] ? ERROR_CODE.AUTH[response.getCode()] : ERROR_CODE.default
          reject(new ApplicationError(401, messageCode));
        }
        resolve(response.toObject());
      })
    })
  }

  // VALID = 0;    
  // DUPLICATE_LOGIN_ID = -1;
  // PASSWORD_NOT_MATCHED = -2;
  // DUPLICATE_EMAIL = -3;
  // INTERNAL_EXCEPTION = -99;
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

  // VALID = 0;    
  // DUPLICATE_LOGIN_ID = -1;
  // PASSWORD_NOT_MATCHED = -2;
  // DUPLICATE_EMAIL = -3;
  // INTERNAL_EXCEPTION = -99;
  public async regist(registPrams: RegistParams): Promise<UserRes.AsObject> {
    return new Promise( (resolve, reject) => {
      const userReq = new UserReq();
      userReq.setEmail(registPrams.email);
      userReq.setLoginId(registPrams.username);
      userReq.setPassword(registPrams.password);
      userReq.setPasswordConfirmation(registPrams.passwordConfirm);
      userReq.setName(registPrams.name);
      this._userClient.signup(userReq, (err: grpc.ServiceError, response: UserRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getCode() !== UserRes.Code.VALID) {
          let messageCode = ERROR_CODE.REGIST[response.getCode()] ? ERROR_CODE.REGIST[response.getCode()] : ERROR_CODE.default
          reject(new ApplicationError(401, messageCode));
        }
        resolve(response.toObject());
      })
    })
  }
}

export default InfuserGrpcAuthorClient;