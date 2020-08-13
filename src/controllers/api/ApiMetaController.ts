import { Request as exRequest } from "express";
import { getRepository, getManager } from "typeorm";
import { Tags, Route, Post, Security, Request, Body } from "tsoa";
import { Service, ServiceStatus } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Meta } from '../../entity/manager/Meta';
import MysqlMetaLoadStrategy from "../../lib/strategies/MysqlMetaLoadStrategy";
import MetaLoader from "../../lib/MetaLoader";
import MetaLoadStrategy from "../../lib/MetaLoadStrategy";
import XlsxMetaLoadStrategy from "../../lib/strategies/XlsxMetaLoadStrategy";
import CubridMetaLoadStrategy from "../../lib/strategies/CubridMetaLoadStrategy";
import CsvMetaLoadStrategy from "../../lib/strategies/CsvMetaLoadStrategy";
import BullManager from '../../util/BullManager';
import MetaLoaderFileParam from "../../lib/interfaces/MetaLoaderFileParam";
import { MetaColumn } from "../../entity/manager/MetaColumn";

const property = require("../../../property.json")
@Route("/api/metas")
@Tags("Meta")
export class ApiMetaController {

  @Post("/dbms")
  @Security("jwt")
  public async postDbms(
    @Request() request: exRequest,
    @Body() dbmsParams: DbmsParams
  ): Promise<Meta> {
    return new Promise(async function(resolve, reject) {
      const metaRepo = getRepository(Meta);
      const serviceRepo = getRepository(Service);
      const { serviceId, title, dbms, host, port, database, user, password, table } = dbmsParams;
      if(title.length == 0 
        || dbms.length == 0 
        || host.length == 0 
        || port.length == 0 
        || database.length == 0 
        || user.length == 0 
        || table.length == 0) {
        reject(new ApplicationError(400, "Need all params"));
      }
      try {
        const service = await serviceRepo.findOneOrFail(serviceId);
        const connectionInfo = {
          dbms: dbms,
          username: user,
          password: password,
          hostname: host,
          port: port,
          database: database,
          tableNm: table,
          title: title
        }

        let loadStrategy: MetaLoadStrategy;
        switch(connectionInfo.dbms) {
          case 'mysql':
            loadStrategy = new MysqlMetaLoadStrategy();
            break;
          case 'cubrid':
            loadStrategy = new CubridMetaLoadStrategy();
            break;
          default:
            throw new Error("unexceptable dbms");
        }
        const metaLoader = new MetaLoader(loadStrategy);
        const loaderResult = await metaLoader.loadMeta(connectionInfo);
        const meta = loaderResult.meta;
        const columns = loaderResult.columns;
        
        service.meta = meta;
        await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
          await transactionalEntityManager.save(meta);
          await transactionalEntityManager.save(columns);
          service.status = ServiceStatus.METALOADED;
          await transactionalEntityManager.save(service);
        });
        const updatedMeta = await metaRepo.findOneOrFail({
          relations: ["service", "columns"],
          where: {
            id: meta.id
          }
        });
        resolve(updatedMeta);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
        return;
      }
    });
  }

  /**
   * 
   * @param request 
   * @param fileParam 
   */
  @Post("/file")
  @Security("jwt")
  public async postFile(
    @Request() request: exRequest,
    @Body() params: FileParams
  ): Promise<any> {
    const serviceRepo = getRepository(Service);
    const _this = this;
    return new Promise(async function(resolve, reject) {
      try {
        const service = await serviceRepo.findOneOrFail(params.serviceId);
        switch(params.dataType) {
          case 'file':
            const fileParam:MetaLoaderFileParam = {
              title: params.title,
              skip: params.skip,
              sheet: params.sheet,
              filePath: params.filePath,
              originalFileName: params.originalFileName,
              ext: params.ext
            }
            const loaderResult = await _this.loadMetaFromFile(fileParam)
            const meta: Meta = loaderResult.meta;
            const columns: MetaColumn[] = loaderResult.columns;
            
            service.meta = meta;
            await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
              await transactionalEntityManager.save(meta);
              await transactionalEntityManager.save(columns);
              service.status = ServiceStatus.METALOADED;
              await transactionalEntityManager.save(service);
            });
            const response = await serviceRepo.findOneOrFail({
              relations: ["meta", "meta.columns"],
              where: {
                id: service.id
              }
            })
            resolve(response);
            break;
          case 'file-url':
            service.status = ServiceStatus.METASCHEDULED;
            /**
             * JobScheduler에 등록을 실패 하는 경우에도 Rollback
             */
            const newMeta = new Meta();
            newMeta.remoteFilePath = params.url;
            newMeta.dataType = params.dataType;
            newMeta.service = service;
            newMeta.extension = params.ext;
            newMeta.title = params.title || "empty title";
            
            const fileName = `${request.user.id}-${Date.now()}.${params.ext}`
            await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
              await transactionalEntityManager.save(service);
              await transactionalEntityManager.save(newMeta);
              BullManager.Instance.setMetaLoaderSchedule(params.serviceId, params.url, fileName);
            });
            resolve(service);
            break;
          default:
            throw new Error("Unacceptable dataType");
        }        
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  public async loadMetaFromFile(fileParam:MetaLoaderFileParam):Promise<any> {
    return new Promise( async (resolve, reject) => {
      try {
        let loadStrategy: MetaLoadStrategy;
        switch(fileParam.ext) {
          case 'xlsx':
            loadStrategy = new XlsxMetaLoadStrategy();
            break;
          case 'csv':
            loadStrategy = new CsvMetaLoadStrategy();
            break;
          default:
            throw new Error("unexceptable file extension");
        }
        const metaLoader = new MetaLoader(loadStrategy);
        const loaderResult = await metaLoader.loadMeta(fileParam);
        resolve(loaderResult)
      } catch (err) {
        reject(err);
      }
    })
  }
}

export interface DbmsParams {
  serviceId: number,
  title: string,
  dbms: string,
  host: string,
  port: string,
  database: string,
  user: string,
  password:string,
  table: string
}

export interface FileParams {
  serviceId: number,
  dataType: string,
  ext: string,
  title: string,
  skip: number,
  sheet: number,
  filePath?: string,
  originalFileName?: string,
  url?: string
}