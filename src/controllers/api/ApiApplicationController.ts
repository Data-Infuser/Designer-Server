import { getRepository, getManager, In, FindManyOptions, FindOneOptions } from "typeorm";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Delete, Query, Controller } from "tsoa";
import { Request as exRequest } from "express";
import { Application } from "../../entity/manager/Application";
import ApplicationError from "../../ApplicationError";
import { Service } from '../../entity/manager/Service';
import { MetaColumn, AcceptableType } from "../../entity/manager/MetaColumn";
import { MetaParam, ParamOperatorType } from "../../entity/manager/MetaParam";
import BullManager from '../../util/BullManager';
import { SwaggerBuilder } from "../../util/SwaggerBuilder";
import { TrafficConfig, TrafficConfigType } from "../../entity/manager/TrafficConfig";
import { Stage } from "../../entity/manager/Stage";
import ApplicationParams from "../../interfaces/requestParams/ApplicationParams";
import { ERROR_CODE } from '../../util/ErrorCodes';

@Route("/api/applications")
@Tags("Applications")
export class ApiApplicationController extends Controller {

  @Get("/")
  @Security("jwt")
  public async get(
    @Request() request: exRequest,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ):Promise<any>{
    const appRepo = getRepository(Application);
    page = page || 1;
    perPage = perPage || 10;

    const findOptions:FindManyOptions = {
      where: {
        userId: request.user.id
      },
      take: perPage,
      skip: (page - 1) * perPage
    }

    const apps = await appRepo.findAndCount(findOptions);

    return Promise.resolve({
      apps: apps[0],
      page,
      perPage,
      totalCount: apps[1]
    });
  }

  /**
   * id를 사용하여 Appplication을 반환합니다.</br>
   * Stages와 trafficConfigs를 포함합니다.
   * @param applicationId 
   * @param request 
   */
  @Get("/{applicationId}")
  @Security("jwt")
  public async getDetail(
    @Path() applicationId: number,
    @Request() request: exRequest
  ): Promise<Application>{
    const appRepo = getRepository(Application);
    const findOptions: FindOneOptions = {
      relations: ["stages", "trafficConfigs"],
      where: {
        id: applicationId,
        userId: request.user.id
      }
    }
    const app = await appRepo.findOne(findOptions);
    if(!app) { throw new ApplicationError(404, ERROR_CODE.APPLICATION.APPLICATION_NOT_FOUND) }
    return Promise.resolve(app);
  }

  /**
   * Application을 생성합니다 </br>
   * Application을 생성하며 default stage(v1)를 함께 생성합니다.
   * @param request 
   * @param applicationParams 
   */
  @Post("/")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Body() applicationParams: ApplicationParams
  ): Promise<Application> {
    const newApplication = new Application();
    newApplication.nameSpace = applicationParams.nameSpace;
    newApplication.title = applicationParams.title;
    newApplication.description = applicationParams.description;
    newApplication.userId = request.user.id;
    
    const dailyMaxTrafic = new TrafficConfig();
    dailyMaxTrafic.maxCount = applicationParams.dailyMaxCount;
    dailyMaxTrafic.type = TrafficConfigType.DAY;

    const monthlyMaxTraffic = new TrafficConfig();
    monthlyMaxTraffic.maxCount = applicationParams.monthlyMaxCount;
    monthlyMaxTraffic.type = TrafficConfigType.MONTH;

    newApplication.trafficConfigs = [dailyMaxTrafic, monthlyMaxTraffic];

    const stage = new Stage();
    stage.name = `${newApplication.lastVersion}`;
    stage.userId = request.user.id;
    newApplication.stages = [stage];
    
    await getManager().transaction(async transactionEntityManager => {
      await transactionEntityManager.save(newApplication);
      dailyMaxTrafic.applicationId = newApplication.id;
      monthlyMaxTraffic.applicationId = newApplication.id;
      stage.applicationId = newApplication.id;
      await transactionEntityManager.save(newApplication.trafficConfigs);
      await transactionEntityManager.save(newApplication.stages);
    });

    this.setStatus(201);
    return Promise.resolve(newApplication);
  }

  @Delete("/{id}")
  @Security("jwt")
  public async delete(
    @Request() request: exRequest,
    @Path("id") id: number
  ): Promise<any> {
    const applicationRepo = getRepository(Application);
    const application = await applicationRepo.findOneOrFail({
      where: {
        id
      }
    });

    if(application.userId !== request.user.id) {
      throw new ApplicationError(404, ERROR_CODE.APPLICATION.APPLICATION_NOT_FOUND)
    }

    await applicationRepo.remove(application);
    return Promise.resolve();
  }

  @Get("/{id}/traffic-configs")
  @Security("jwt")
  public async getTrafficConfigs(
    @Request() request: exRequest,
    @Path("id") id: number
  ): Promise<TrafficConfig[]> {
    const applicationRepo = getRepository(Application);
    const application = await applicationRepo.findOne({
      relations: ["trafficConfigs"],
      where: {
        id: id,
        userId: request.user.id
      }
    })
    const configs = application.trafficConfigs;
    return Promise.resolve(configs);
  }

  @Post("/{id}/traffic-configs")
  @Security("jwt")
  public async postTrafficConfigs(
    @Request() request: exRequest,
    @Path("id") id: number,
    @Body() trafficConfigParams: TrafficConfigParam[]
  ): Promise<TrafficConfig[]> {
    const applicationRepo = getRepository(Application);
    const trafficConfigRepo = getRepository(TrafficConfig);

    const application = await applicationRepo.findOneOrFail(id)
    if(application.userId !== request.user.id) {
      throw Error("unAuthorized Error");
    }

    const trafficConfigs:TrafficConfig[] = []
    for( let trafficConfigParam of trafficConfigParams) {
      let newTrafficConfig = await trafficConfigRepo.findOne({
        where: {
          application: {
            id: id
          },
          type: trafficConfigParam.type
        }
      })
      if(!newTrafficConfig) newTrafficConfig = new TrafficConfig();
      newTrafficConfig.application = application;
      newTrafficConfig.type = trafficConfigParam.type;
      newTrafficConfig.maxCount = trafficConfigParam.maxCount;
      trafficConfigs.push(newTrafficConfig);
    }
    
    await trafficConfigRepo.save(trafficConfigs);

    return Promise.resolve(trafficConfigs);
  }

}

interface ApplicationSaveParams {
  id: number,
  nameSpace: string,
  title: string,
  description: string,
  services: ServiceSaveParams[],
  params: {
    [id:string]: MetaParamSaveParams[]
  }
}

interface ServiceSaveParams {
  id: number,
  title: string,
  method: string,
  description: string,
  entityName: string,
  meta?: MetaSaveParams|null
}

interface MetaSaveParams {
  id: number,
  title: string,
  dataType: string,
  columns: MetaColumnSaveParams[]
}

interface MetaColumnSaveParams {
  id: number,
  columnName: string,
  isHidden: boolean,
  isSearchable: boolean,
  size?: number|string|null,
  type: AcceptableType,
  order: number,
  originalColumnName: string,
}

interface MetaParamSaveParams {
  id?: number,
  description?: string,
  isRequired: boolean,
  operator: ParamOperatorType
}

interface TrafficConfigParam {
  type: string,
  maxCount: number
}

interface StageParams {
  name: string
}