import { getRepository, getManager, In } from "typeorm";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Delete, Query } from "tsoa";
import { Request as exRequest } from "express";
import { Application } from "../../entity/manager/Application";
import ApplicationError from "../../ApplicationError";
import { Service, ServiceStatus } from '../../entity/manager/Service';
import { MetaColumn, AcceptableType } from "../../entity/manager/MetaColumn";
import { MetaParam, ParamOperatorType } from "../../entity/manager/MetaParam";
import BullManager from '../../util/BullManager';
import { SwaggerBuilder } from "../../util/SwaggerBuilder";
import { TrafficConfig } from "../../entity/manager/TrafficConfig";
import { Stage } from "../../entity/manager/Stage";

@Route("/api/applications")
@Tags("Applications")
export class ApiApplicationController {

  @Get("/")
  @Security("jwt")
  public async get(
    @Request() request: exRequest,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ){
    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
      page = page || 1;
      perPage = perPage || 10;
      try {
        const apps = await appRepo.findAndCount({
          where: {
            user: {
              id: request.user.id
            }
          },
          take: perPage,
          skip: (page - 1) * perPage
        });
        resolve({
          apps: apps[0],
          page,
          perPage,
          totalCount: apps[1]
        });
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }

  @Get("/{applicationId}/api-docs")
  //@Security("jwt")
  public async getDocs(
    @Path() applicationId: number,
    @Request() request: exRequest
  ){
    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
      try {
        const app = await appRepo.findOneOrFail({
          relations: ["services", "services.meta", "services.meta.columns", "services.meta.columns.params", "services.columns"],
          where: {
            id: applicationId
          }
        });
        console.log(app);
        const doc = SwaggerBuilder.buildApplicationDoc(app);
        resolve(doc);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }

  @Get("/{applicationId}")
  @Security("jwt")
  public async getDetail(
    @Path() applicationId: number,
    @Request() request: exRequest
  ){
    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
    try {
      const app = await appRepo.findOneOrFail({
        relations: ["stages", "services", "services.meta", "services.meta.columns", "services.meta.columns.params"],
        where: {
          id: applicationId,
          user: {
            id: request.user.id
          }
        }
      });
      resolve(app);
    } catch (err) {
      console.error(err);
      reject(new ApplicationError(500, err.message));
    }
    });
  }

  @Post("/")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Body() applicationParams: ApplicationParams
  ): Promise<Application> {
    return new Promise(async function(resolve, reject) {
      const applicationRepo = getRepository(Application);
      const { nameSpace, title, description } = applicationParams;
      try {
        const newApplication = new Application();
        newApplication.nameSpace = nameSpace;
        newApplication.title = title;
        newApplication.description = description;
        newApplication.user = request.user;
        await applicationRepo.save(newApplication);

        resolve(newApplication);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }

  @Delete("/{id}")
  @Security("jwt")
  public async delete(
    @Request() request: exRequest,
    @Path("id") id: number
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const applicationRepo = getRepository(Application);
      try {
        const application = await applicationRepo.findOneOrFail({
          relations: ["user"],
          where: {
            id
          }
        });

        if(application.user.id !== request.user.id) {
          reject(new ApplicationError(401, "Unauthorized Error"));
        }

        await applicationRepo.remove(application);
        resolve();
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  @Post("/{id}/stages")
  @Security("jwt")
  public async postStage(
    @Request() request: exRequest,
    @Path("id") id: number,
    @Body() stageParams: StageParams
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const applicationRepo = getRepository(Application);
      const stageRepo = getRepository(Stage);
      try {
        const application = await applicationRepo.findOneOrFail({
          relations: ["user", "services", "services.stage"],
          where: {
            id: id,
            user: {
              id: request.user.id
            }
          }
        });
        
        const newStage:Stage = application.createStage(stageParams.name);

        if(!await BullManager.Instance.dataLoaderQueue.isReady()) {
          reject(new ApplicationError(401, "Job Queue가 준비되지 않았습니다."));
          return;
        }

        await getManager().transaction(async transactionEntityManager => {
          await transactionEntityManager.save(newStage);
          newStage.services.forEach(el => {
            el.stage = newStage
          });
          await transactionEntityManager.save(newStage.services);
          console.log(newStage);
          BullManager.Instance.setDataLoaderSchedule(newStage);
          console.log("done");
        });
        resolve(await stageRepo.findOneOrFail({
          relations: ["services", "application"],
          where: {
            id: newStage.id
          }
        }));
      } catch (err) {
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  @Post("/{id}/save")
  @Security("jwt")
  public async save(
    @Path("id") id: number,
    @Body() applicationSavePrams: ApplicationSaveParams
  ): Promise<Application> {
    return new Promise(async (resolve, reject) => {
      const applicationRepo = getRepository(Application);
      const serviceRepo = getRepository(Service);
      const metaColumnRepo = getRepository(MetaColumn);
      const metaParamRepo = getRepository(MetaParam);
      let paramsForDelete:MetaParam[] = [];
      const newPrams: MetaParam[] = []
      try {
        //application
        const application = await applicationRepo.findOneOrFail({
          relations: ['stages'],
          where: {
            id: id
          }
        })

        // if (application.status !== ApplicationStatus.IDLE) {
        //   reject(new ApplicationError(400, "It's not IDLE state application"));
        //   return;
        // }
        application.description = applicationSavePrams.description;
        application.nameSpace = applicationSavePrams.nameSpace;
        application.title = applicationSavePrams.title;
        //services
        const serviceIds = applicationSavePrams.services.map((params) => params.id);
        const services = await serviceRepo.findByIds(serviceIds, {
          relations: ["meta", "meta.columns", "meta.columns.params"]
        });

        for(const service of services) {
          if(!service.meta) continue;
          const modifiedService = applicationSavePrams.services.find(el => el.id === service.id);
          const metaColumns = service.meta.columns
          for(const column of metaColumns) {
            let modifiedColumn = modifiedService.meta.columns.find(columnParam => columnParam.id === column.id);
            column.isHidden = modifiedColumn.isHidden;
            column.isSearchable = modifiedColumn.isSearchable;
            column.columnName = modifiedColumn.columnName;
            column.type = modifiedColumn.type;
            column.size = Number(modifiedColumn.size);
            if(applicationSavePrams.params[column.id]) {
              paramsForDelete = paramsForDelete.concat(column.params);
              const params = applicationSavePrams.params[column.id]
              for(const param of params) {
                const newParam = new MetaParam();
                newParam.operator = param.operator;
                newParam.description = param.description;
                newParam.isRequired = param.isRequired;
                newParam.metaColumn = column;
                newPrams.push(newParam);
              }
            }
          }
        }
        await getManager().transaction(async transactionEntityManager => {
          await transactionEntityManager.save(application);
          await transactionEntityManager.save(services);
          for(const service of services) {
            if(!service.meta) continue;
            await transactionEntityManager.save(service.meta.columns);
          }
          await metaParamRepo.remove(paramsForDelete);
          await transactionEntityManager.save(newPrams);
        })
        resolve(application);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }


  @Get("/{id}/traffic-configs")
  @Security("jwt")
  public async getTrafficConfigs(
    @Request() request: exRequest,
    @Path("id") id: number
  ): Promise<TrafficConfig[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const applicationRepo = getRepository(Application);
        const application = await applicationRepo.findOne({
          relations: ["trafficConfigs"],
          where: {
            id: id,
            userId: request.user.id
          }
        })
        const configs = application.trafficConfigs;
        resolve(configs);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  @Post("/{id}/traffic-configs")
  @Security("jwt")
  public async postTrafficConfigs(
    @Request() request: exRequest,
    @Path("id") id: number,
    @Body() trafficConfigParams: TrafficConfigParam[]
  ): Promise<TrafficConfig[]> {
    return new Promise(async (resolve, reject) => {
      try {
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
        resolve(trafficConfigs);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

}

interface ApplicationParams {
  nameSpace: string,
  title: string,
  description: string
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