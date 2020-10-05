import * as grpc from "grpc";
import { LoginReq, AuthResult, AuthRes, RefreshTokenReq } from '../lib/infuser-protobuf/gen/proto/author/auth_pb';
import { AuthServiceClient } from "../lib/infuser-protobuf/gen/proto/author/auth_grpc_pb";
import ApplicationError from '../ApplicationError';
import { UserReq, UserRes } from '../lib/infuser-protobuf/gen/proto/author/user_pb';
import { UserServiceClient } from "../lib/infuser-protobuf/gen/proto/author/user_grpc_pb";
import { ERROR_CODE } from '../util/ErrorCodes';
import { RegistParams } from "../controllers/api/AuthController";
import { AppManagerClient } from "../lib/infuser-protobuf/gen/proto/author/app_grpc_pb";
import { AppReq, AppRes } from '../lib/infuser-protobuf/gen/proto/author/app_pb.d';
import { Application } from '../entity/manager/Application';
import { Stage } from "../entity/manager/Stage";

const property = require("../../property.json");

// message AppReq {
//   uint32 app_id = 2;
//   string name_space = 1;

//   message AppTraffic {
//     string unit = 1;
//     uint32 value = 2;
//     uint32 seq = 3;
//   }
//   repeated AppTraffic traffics = 3;

//   message Operation {
//     string end_point = 1;
//     uint32 operation_id = 2;
//   }
//   repeated Operation operations = 4;
// }

class InfuserGrpcAppClient {
  private static _instance: InfuserGrpcAppClient;

  private _appClient: AppManagerClient;

  constructor() {
    const server = `${property.grpc.auth.host}:${property.grpc.auth.port}`
    this._appClient = new AppManagerClient(server, grpc.credentials.createInsecure());
  }

  public static get Instance() {
    if(!InfuserGrpcAppClient._instance) InfuserGrpcAppClient._instance = new InfuserGrpcAppClient();
    return this._instance;
  }

  // VALID = 0;    
  // DUPLICATE_LOGIN_ID = -1;
  // PASSWORD_NOT_MATCHED = -2;
  // DUPLICATE_EMAIL = -3;
  // INTERNAL_EXCEPTION = -99;
  public async create(stage: Stage): Promise<AppRes.AsObject> {
    return new Promise( (resolve, reject) => {
      const appRequst = new AppReq();
      appRequst.setAppId(stage.id);
      appRequst.setNameSpace(`${stage.application.nameSpace}/v${stage.name}`)

      let seq = 0;
      let traffics = [];
      stage.application.trafficConfigs.forEach(tc => {
        const appTraffic = new AppReq.AppTraffic();
        appTraffic.setUnit(tc.type);
        appTraffic.setValue(tc.maxCount);
        appTraffic.setSeq(seq++);
        traffics.push(appTraffic);
      });
      appRequst.setTrafficsList(traffics);

      let operations = [];
      stage.metas.forEach(meta => {
        const operation = new AppReq.Operation();
        operation.setEndPoint(meta.service.entityName);
        operation.setOperationId(meta.service.id);
        operations.push(operation);
      })
      appRequst.setOperationsList(operations);


      this._appClient.create(appRequst, (err: grpc.ServiceError, response: AppRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getStatus() !== AppRes.Status.OK) {
          reject(new ApplicationError(401, 'create fail'));
        }
        resolve(response.toObject());
      })
    })
  }

  public async update(stage: Stage): Promise<AppRes.AsObject> {
    return new Promise( (resolve, reject) => {
      const appRequst = new AppReq();
      appRequst.setAppId(stage.id);
      appRequst.setNameSpace(`${stage.application.nameSpace}/v${stage.name}`)

      let seq = 0;
      let traffics = [];
      stage.application.trafficConfigs.forEach(tc => {
        const appTraffic = new AppReq.AppTraffic();
        appTraffic.setUnit(tc.type);
        appTraffic.setValue(tc.maxCount);
        appTraffic.setSeq(seq++);
        traffics.push(appTraffic);
      });
      appRequst.setTrafficsList(traffics);

      let operations = [];
      stage.metas.forEach(meta => {
        const operation = new AppReq.Operation();
        operation.setEndPoint(meta.service.entityName);
        operation.setOperationId(meta.service.id);
        operations.push(operation);
      })
      appRequst.setOperationsList(operations);


      this._appClient.update(appRequst, (err: grpc.ServiceError, response: AppRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getStatus() !== AppRes.Status.OK) {
          reject(new ApplicationError(401, 'create fail'));
        }
        resolve(response.toObject());
      })
    })
  }

  public async destroy(stage: Stage): Promise<AppRes.AsObject> {
    return new Promise( (resolve, reject) => {
      const appRequst = new AppReq();
      appRequst.setAppId(stage.id);

      this._appClient.destroy(appRequst, (err: grpc.ServiceError, response: AppRes) => {
        if(err) {
          reject(new Error(err.message));
        } else if(response.getStatus() !== AppRes.Status.OK) {
          reject(new ApplicationError(401, 'create fail'));
        }
        resolve(response.toObject());
      })
    })
  }
}

export default InfuserGrpcAuthorClient;