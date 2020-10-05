import * as grpc from "grpc";
import ApplicationError from '../ApplicationError';
import { AppManagerClient } from "../lib/infuser-protobuf/gen/proto/author/app_grpc_pb";
import { AppReq, AppRes } from '../lib/infuser-protobuf/gen/proto/author/app_pb';
import { Stage } from "../entity/manager/Stage";

const property = require("../../property.json");

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

export default InfuserGrpcAppClient;