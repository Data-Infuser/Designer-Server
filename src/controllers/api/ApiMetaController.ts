import { Request as exRequest } from "express";
import { getRepository, getManager, getConnection } from "typeorm";
import { Tags, Route, Post, Security, Request, Body, Controller, Get, Path, Put, Delete, Query, Patch } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Meta, MetaStatus } from '../../entity/manager/Meta';
import BullManager from '../../util/BullManager';
import { MetaColumn, AcceptableType } from "../../entity/manager/MetaColumn";
import DbmsParams from "../../interfaces/requestParams/DbmsParams";
import FileParams from "../../interfaces/requestParams/FileParams";
import { Application } from "../../entity/manager/Application";
import { Stage } from "../../entity/manager/Stage";
import ServiceParams from '../../interfaces/requestParams/ServiceParams';
import Pagination from "../../util/Pagination";
import { ERROR_CODE } from '../../util/ErrorCodes';
import { SwaggerBuilder } from "../../util/SwaggerBuilder";
import { MetaParamParams } from "../../interfaces/requestParams/MetaParamParams";
import { MetaParam } from "../../entity/manager/MetaParam";

const property = require("../../../property.json")
@Route("/api/metas")
@Tags("Meta")
export class ApiMetaController extends Controller {

  /**
   * meta의 목록
   * @param request 
   * @param page 
   * @param perPage 
   */
  @Get("/")
  @Security("jwt")
  public async getIndex(
    @Request() request: exRequest,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ):Promise<Pagination<Meta>>{
    const pagination = new Pagination(Meta, getConnection());
    const relations = ["stage", "stage.application"];
    await pagination.findBySearchParams(relations, page, perPage, request.user.id);
    return Promise.resolve(pagination);
  }

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

    if(!meta) { throw new ApplicationError(404, ERROR_CODE.META.META_NOT_FOUND); }

    return Promise.resolve(meta);
  }

  /**
   * meta의 id를 사용하여 meta의 상세 정보를 불러 올 수 있습니다.
   * meta의 Columns 정보를 포함합니다.
   * @param metaId 
   * @param request 
   */
  @Get("/{metaId}/api-docs")
  public async getApiDoc(
    @Path() metaId: number,
    @Request() request: exRequest
  ): Promise<String> {
    const metaRepo = getRepository(Meta);

    const meta = await metaRepo.findOne({
      relations: ["columns", "service", "stage", "stage.application", "columns.params"],
      where: {
        id: metaId
      }
    })

    if(!meta) { throw new ApplicationError(404, ERROR_CODE.META.META_NOT_FOUND); }

    const doc = SwaggerBuilder.buildApplicationDoc(meta.stage, meta);

    return Promise.resolve(doc);
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
      throw new ApplicationError(400, ERROR_CODE.META.NEED_ALL_PARAM);
    }

    const stage = await stageRepo.findOne({
      where: {
        id: stageId,
        userId: request.user.id
      }
    });
    if(!stage) {throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND)}

    const queryRunner = await getConnection().createQueryRunner()

    const meta: Meta = new Meta();
    meta.dataType = 'dbms';
    meta.dbms = dbms;
    meta.dbUser = user;
    meta.pwd = password;
    meta.host = host;
    meta.port = port;
    meta.db = database;
    meta.table = table;
    meta.title = title;
    meta.stageId = stage.id;
    meta.userId = request.user.id;
    meta.status = MetaStatus.METALOAD_SCHEDULED;

    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(meta);
      BullManager.Instance.setMetaLoaderSchedule(meta.id);
      await queryRunner.commitTransaction();
    } catch(err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    this.setStatus(201);
    return Promise.resolve(meta);
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
    const queryRunner = await getConnection().createQueryRunner()
    switch(params.dataType) {
      case 'file':
        const meta: Meta = new Meta();
        meta.dataType = 'file';
        meta.title = params.title;
        meta.skip = params.skip;
        meta.sheet = params.sheet;
        meta.filePath = params.filePath;
        meta.originalFileName = params.originalFileName;
        meta.extension = params.ext;
        meta.stageId = params.stageId;
        meta.userId = request.user.id;
        meta.status = MetaStatus.METALOAD_SCHEDULED;
        await queryRunner.startTransaction();
        try {
          await queryRunner.manager.save(meta);
          BullManager.Instance.setMetaLoaderSchedule(meta.id);
          await queryRunner.commitTransaction();
        } catch(err) {
          await queryRunner.rollbackTransaction();
        } finally {
          await queryRunner.release();
        }
        this.setStatus(201);
        return Promise.resolve(meta);
      case 'file-url':
        /**
         * JobScheduler에 등록을 실패 하는 경우에도 Rollback
         */
        const newMeta = new Meta();
        newMeta.dataType = 'file-url';
        newMeta.remoteFilePath = params.url;
        newMeta.dataType = params.dataType;
        newMeta.extension = params.ext;
        newMeta.title = params.title || "empty title";
        
        newMeta.stageId = params.stageId;
        newMeta.userId = request.user.id;
        newMeta.status = MetaStatus.DOWNLOAD_SCHEDULED;
        const fileName = `${request.user.id}-${Date.now()}.${params.ext}`
        await queryRunner.startTransaction();
        try {
          await queryRunner.manager.save(newMeta);
          BullManager.Instance.setDownloadSchedule(newMeta.id, params.url, fileName);
          await queryRunner.commitTransaction();
        } catch(err) {
          await queryRunner.rollbackTransaction();
        } finally {
          await queryRunner.release();
        }

        this.setStatus(201);
        return Promise.resolve(newMeta);
      default:
        throw new ApplicationError(400, ERROR_CODE.META.UNACCEPTABLE_FILE_TYPE)
    }        
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
      relations: ["columns", "columns.params"],
      where: {
        id: metaId
      }
    });
    this.setStatus(201);
    return Promise.resolve(meta);
  }

  /**
   * Meta의 Columns 정보를 수정 할 수 있습니다.\n
   * 해당 entity의 id가 있는 경우 update, 없는 경우 Insert를 수행합니다.
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
    const meta = await getRepository(Meta).findOne({
      relations: ["columns", "service"],
      where: {
        id: metaId,
        userId: request.user.id
      }
    });

    if(!meta) { throw new ApplicationError(404, ERROR_CODE.META.META_NOT_FOUND); }

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
      for(let column of updateMetaParam.columns) {
        if(column.params) {
          await transactionalEntityManager.save(MetaParam, column.params);
        }
      }
    });
    
    this.setStatus(201);
    return Promise.resolve(await getRepository(Meta).findOne({
      relations: ["columns", "columns.params", "service"],
      where: {
        id: meta.id
      }
    }));
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

    if(!meta || !meta.service) { throw new ApplicationError(404, ERROR_CODE.META.META_NOT_FOUND) }

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
  size: string,
  isSearchable: boolean,
  isNullable: boolean,
  isHidden: boolean,
  dateFormat?: string
  params?: MetaParamParams[]
}