import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import { DatabaseConnection, AcceptableDbms } from "../../entity/manager/DatabaseConnection";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Put } from "tsoa";
import { Request as exRequest, application } from "express";
import { Application } from "../../entity/manager/Application";
import ApplicationError from "../../ApplicationError";
import { Service } from '../../entity/manager/Service';
import { MetaColumn, AcceptableType } from "../../entity/manager/MetaColumn";
import { MetaParam, ParamOperatorType } from "../../entity/manager/MetaParam";

@Route("/api/applications")
@Tags("Applications")
export class ApiApplicationController {

  @Get("/")
  @Security("jwt")
  public async get(
    @Request() request: exRequest
  ){
    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
    try {
      const apps = await appRepo.find({
        where: {
          user: {
            id: request.user.id
          }
        }
      });
      resolve(apps);
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
        relations: ["services", "services.meta", "services.meta.columns", "services.meta.columns.params"],
        where: {
          id: applicationId,
          user: {
            id: request.user.id
          }
        }
      });
      console.log(app);
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

  @Post("/{id}/save")
  @Security("jwt")
  public async save(
    @Path("id") id: number,
    @Body() applicationSavePrams: ApplicationSaveParams
  ): Promise<Application> {
    console.log(applicationSavePrams);
    return new Promise(async (resolve, reject) => {
      const applicationRepo = getRepository(Application);
      const serviceRepo = getRepository(Service);
      const metaColumnRepo = getRepository(MetaColumn);
      const metaParamRepo = getRepository(MetaParam);
      let paramsForDelete:MetaParam[] = [];
      const newPrams: MetaParam[] = []
      try {
        //application
        const application = await applicationRepo.findOneOrFail(id)
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
  },
  status?: any,
  createdAt?: any,
  updatedAt?: any
}

interface ServiceSaveParams {
  id: number,
  title: string,
  method: string,
  description: string,
  entityName: string,
  tableName?: any,
  columnLength?: any,
  dataCounts?: any,
  status?: any,
  createdAt?: any,
  updatedAt?: any,
  meta?: MetaSaveParams|null
}

interface MetaSaveParams {
  id: number,
  title: string,
  dataType: string,
  columns: MetaColumnSaveParams[]
  originalFileName?: any,
  filePath?: any,
  extension?: any,
  host?: any,
  port?: any,
  db?: any,
  dbUser?: any,
  pwd?: any,
  table?: any,
  dbms?: any,
  rowCounts?: any,
  skip?: any,
  sheet?: any,
  isActive?: any,
  createdAt?: any,
  updatedAt?: any
}

interface MetaColumnSaveParams {
  id: number,
  columnName: string,
  isHidden: boolean,
  isSearchable: boolean,
  size?: number|string,
  type: AcceptableType,
  serviceId?: number|string,
  order: number,
  originalColumnName: string,
  createdAt?: any,
  updatedAt?: any,
  params?: any
}

interface MetaParamSaveParams {
  id?: number,
  description?: string,
  isRequired: boolean,
  operator: ParamOperatorType,
  createdAt?: any,
  updatedAt?: any
}