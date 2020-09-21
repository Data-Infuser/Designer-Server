import { Request as exRequest } from "express";
import { getRepository, getManager } from "typeorm";
import { Tags, Route, Post, Security, Request, Body, Controller, Get, Path, Put, Delete } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Meta, MetaStatus } from '../../entity/manager/Meta';
import MysqlMetaLoadStrategy from "../../lib/strategies/MysqlMetaLoadStrategy";
import MetaLoader from "../../lib/MetaLoader";
import MetaLoadStrategy from "../../lib/MetaLoadStrategy";
import XlsxMetaLoadStrategy from "../../lib/strategies/XlsxMetaLoadStrategy";
import CubridMetaLoadStrategy from "../../lib/strategies/CubridMetaLoadStrategy";
import CsvMetaLoadStrategy from "../../lib/strategies/CsvMetaLoadStrategy";
import BullManager from '../../util/BullManager';
import MetaLoaderFileParam from "../../lib/interfaces/MetaLoaderFileParam";
import { MetaColumn, AcceptableType } from "../../entity/manager/MetaColumn";
import DbmsParams from "../../interfaces/requestParams/DbmsParams";
import FileParams from "../../interfaces/requestParams/FileParams";
import { Application } from "../../entity/manager/Application";
import { Stage } from "../../entity/manager/Stage";
import ServiceParams from '../../interfaces/requestParams/ServiceParams';

const property = require("../../../property.json")
@Route("/api/metas")
@Tags("Meta")
export class ApiMetaController extends Controller {

  /**
   * meta의 id를 사용하여 meta의 상세 정보를 불러 올 수 있습니다.
   * meta의 Columns 정보를 포함합니다.
   * @param metaId 
   * @param request 
   */
  @Get("/{metaId}")
  @Security("jwt")
  public async get(
    @Path() metaId: number,
    @Request() request: exRequest
  ): Promise<Meta> {
    const metaRepo = getRepository(Meta);

    const meta = await metaRepo.findOne({
      relations: ["columns", "service"],
      where: {
        id: metaId,
        userId: request.user.id
      }
    })

    if(!meta) {
      throw new ApplicationError(404, "Meta Not Fount");
    }

    return Promise.resolve(meta);
  }

  /**
   * database 연결 정보를 이용하여 DB 데이터를 불러오기 위한 Meta 를 등록합니다.
   * 
   * @param request 
   * @param dbmsParams Meta title과 DB 연결 정보, stageId</br> 지원 dbms: "mysql"|"cubrid"
   */
  @Post("/dbms")
  @Security("jwt")
  public async postDbms(
    @Request() request: exRequest,
    @Body() dbmsParams: DbmsParams
  ): Promise<Meta> {
    const metaRepo = getRepository(Meta);
    const stageRepo = getRepository(Stage);
    const { title, dbms, host, port, database, user, password, table, stageId } = dbmsParams;
    if(title.length == 0 
      || dbms.length == 0 
      || host.length == 0 
      || port.length == 0 
      || database.length == 0 
      || user.length == 0 
      || table.length == 0) {
      throw new ApplicationError(400, "Need all params");
    }

    const stage = await stageRepo.findOne(stageId);
    if(!stage) {throw new ApplicationError(404, "Entity Not Found")}

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
    const meta: Meta = loaderResult.meta;
    const columns = loaderResult.columns;

    meta.stageId = stage.id;
    meta.userId = request.user.id;
    await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
      await transactionalEntityManager.save(meta);
      await transactionalEntityManager.save(columns);
    });

    const updatedMeta = await metaRepo.findOneOrFail({
      relations: ["stage", "columns"],
      where: {
        id: meta.id
      }
    });
    this.setStatus(201);
    return Promise.resolve(updatedMeta);
  }

  /**
   * File 정보를 이용하여 Meta를 등록합니다.</br></br>
   * dataType이 'file'인 경우 Meta가 바로 등록이 됩니다.</br>
   * dataType이 'file-url'인 경우 meta-download-scheduled 상태와 함께 등록이 되고, 이후 Scheduler가 파일 다운로드를 완료한 이후 상태값이 변경됩니다.
   * @param request 
   * @param fileParam dataType은 'file' 또는 'file-url'이 허용됩니다.
   */
  @Post("/file")
  @Security("jwt")
  public async postFile(
    @Request() request: exRequest,
    @Body() params: FileParams
  ): Promise<Meta> {
    const serviceRepo = getRepository(Service);
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
        const loaderResult = await this.loadMetaFromFile(fileParam)
        const meta: Meta = loaderResult.meta;
        const columns: MetaColumn[] = loaderResult.columns;
        
        meta.stageId = params.stageId;
        meta.userId = request.user.id;
        await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
          await transactionalEntityManager.save(meta);
          await transactionalEntityManager.save(columns);
        });
        this.setStatus(201);
        return Promise.resolve(meta);
      case 'file-url':
        /**
         * JobScheduler에 등록을 실패 하는 경우에도 Rollback
         */
        const newMeta = new Meta();
        newMeta.remoteFilePath = params.url;
        newMeta.dataType = params.dataType;
        newMeta.extension = params.ext;
        newMeta.title = params.title || "empty title";
        
        newMeta.stageId = params.stageId;
        newMeta.userId = request.user.id;
        newMeta.status = MetaStatus.DOWNLOAD_SCHEDULED;
        const fileName = `${request.user.id}-${Date.now()}.${params.ext}`
        await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
          await transactionalEntityManager.save(newMeta);
          /**
           * TODO: Jonqueue에서 사용하는 ServiceId 확인 후 스케쥴 등록 기능 수정 필요
           */
          BullManager.Instance.setMetaLoaderSchedule(newMeta.id, params.url, fileName);
        });
        this.setStatus(201);
        return Promise.resolve(newMeta);
      default:
        throw new Error("Unacceptable dataType");
    }        
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

  /**
   * Meta의 Columns 정보를 수정 할 수 있습니다.
   * 
   * @param request
   * @param metaColumnsParam 변경된 Meta.columns를 { columns: [] } 형식
   * @param metaId Columns의 Parent meta id
   */
  @Put('/{metaId}/columns')
  @Security('jwt')
  public async putColumns(
    @Request() request: exRequest,
    @Body() metaColumnsParam: MetaColumnsParam,
    @Path('metaId') metaId: number,
  ) {
    const metaColumnRepo = getRepository(MetaColumn);
    await metaColumnRepo.save(metaColumnsParam.columns)
    const meta = await getRepository(Meta).findOne({
      relations: ["columns"],
      where: {
        id: metaId
      }
    });
    this.setStatus(201);
    return Promise.resolve(meta);
  }

  /**
   * Meta의 Columns 정보를 수정 할 수 있습니다.
   * 
   * @param request
   * @param updateMetaParam 변경된 Meta.columns를 { columns: [] } 형식
   * @param metaId Columns의 Parent meta id
   */
  @Put('/{metaId}')
  @Security('jwt')
  public async putMeta(
    @Request() request: exRequest,
    @Body() updateMetaParam: UpdateMetaParam,
    @Path('metaId') metaId: number,
  ) {
    const metaColumnRepo = getRepository(MetaColumn);

    const meta = await getRepository(Meta).findOne({
      relations: ["columns", "service"],
      where: {
        id: metaId,
        userId: request.user.id
      }
    });

    if(!meta) { throw new ApplicationError(404, "meta not found") }

    let service:Service;
    if(updateMetaParam.service) {
      if(!meta.service) {
        service = new Service();
        service.meta = meta;
      } else {
        service = meta.service
      }
  
      service.entityName = updateMetaParam.service.entityName;
      service.description = updateMetaParam.service.description;
      service.method = updateMetaParam.service.method;
    }
    
    await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
      if(updateMetaParam.columns) { await transactionalEntityManager.save(MetaColumn, updateMetaParam.columns) };
      if(updateMetaParam.service) { await transactionalEntityManager.save(service) };
    });
    
    this.setStatus(201);
    return Promise.resolve(meta);
  }

  @Delete('/{metaId}/service')
  @Security('jwt')
  public async delete(
    @Request() request: exRequest,
    @Path('metaId') metaId: number,
  ) {
    const meta = await getRepository(Meta).findOne({
      relations: ["service"],
      where: {
        id: metaId,
        userId: request.user.id
      }
    });

    if(!meta || !meta.service) { throw new ApplicationError(404, "meta not found") }

    await getRepository(Service).delete(meta.service.id);
    this.setStatus(201);
    return Promise.resolve();
  }
}

interface UpdateMetaParam {
  columns?: MetaColumnParam[],
  service?: ServiceParams
}

interface MetaColumnsParam {
  columns: MetaColumnParam[]
}

interface MetaColumnParam {
  id: number,
  columnName: string,
  type: AcceptableType,
  size: number,
  isSearchable: boolean,
  isNullable: boolean,
  dateFormat?: string
}