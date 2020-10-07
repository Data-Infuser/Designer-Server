import { Route, Tags, Security, Request, Post, Path, Delete, Get, Controller, Query } from "tsoa";
import { Request as exRequest } from "express";
import ApplicationError from "../../ApplicationError";
import { Stage, StageStatus } from "../../entity/manager/Stage";
import { getRepository, getManager } from 'typeorm';
import { Service } from '../../entity/manager/Service';
import fs from 'fs';
import ts from "typescript";
import { request } from "http";
import { MetaStatus } from "../../entity/manager/Meta";
import BullManager from "../../util/BullManager";
import { getConnection } from 'typeorm';
import Pagination from '../../util/Pagination';
import { ERROR_CODE } from '../../util/ErrorCodes';
import { SwaggerBuilder } from "../../util/SwaggerBuilder";
import InfuserGrpcAppClient from '../../grpc/InfuserGrpcAppClient';

@Route('/api/stages')
@Tags('Stage')
export class ApiStageController extends Controller {
  
  @Get('/')
  @Security('jwt')
  public async get(
    @Request() request: exRequest,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ): Promise<Pagination<Stage>>{
    const pagination = new Pagination(Stage, getConnection());
    const relations = ["metas", "application"];
    await pagination.findBySearchParams(relations, page, perPage, request.user.id);
    return Promise.resolve(pagination);
  }

  @Get('/{stageId}')
  @Security('jwt')
  public async getStageById(
    @Path('stageId') stageId: number,
    @Request() request: exRequest
  ): Promise<Stage> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOne({
      relations: ["metas", "metas.service", "application"],
      where: {
        id: stageId,
        userId: request.user.id
      }
    })

    if(!stage) {
      throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND);
    }

    return stage;
  }

  /**
   * 해당 API의 Swagger 문서를 불러옵니다.
   * @param stageId 
   * @param request 
   */
  @Get('/{stageId}/api-docs')
  // @Security('jwt')
  public async getStageSwagger(
    @Path('stageId') stageId: number,
    @Request() request: exRequest
  ): Promise<any> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOne({
      relations: ["metas", "metas.service", "application", "metas.columns", "metas.columns.params"],
      where: {
        id: stageId
      }
    })

    if(!stage) {
      throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND);
    }

    const doc = SwaggerBuilder.buildApplicationDoc(stage);

    return doc;
  }

  @Post('/{stageId}/load-data')
  @Security('jwt')
  public async loadData(
    @Request() request: exRequest,
    @Path('stageId') stageId: number
  ): Promise<Stage> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOne({
      relations: ["metas", "metas.service", "application"],
      where: {
        id: stageId,
        userId: request.user.id
      }
    })

    if(!stage) {
      throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND);
    } else if(!stage.metas.every( meta => meta.status === MetaStatus.METALOADED)) {
      throw new ApplicationError(400, ERROR_CODE.STAGE.ALL_METAS_SHOULD_BE_LOADED);
    } else if(!stage.metas.every( meta => meta.service !== null)) {
      throw new ApplicationError(400, ERROR_CODE.STAGE.ALL_METAS_SHOULD_HAVE_SERVICE);
    }

    stage.status = StageStatus.SCHEDULED;
    stage.metas.forEach( meta => {
      meta.status = MetaStatus.DATA_LOAD_SCHEDULED;
    })
    const queryRunner = getConnection().createQueryRunner();
    try {
      await queryRunner.startTransaction();
      await queryRunner.manager.save(stage);
      await queryRunner.manager.save(stage.metas);
      BullManager.Instance.setDataLoaderSchedule(stage);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new ApplicationError(500, err.message);
    } finally {
      await queryRunner.release();
    }

    this.setStatus(201);
    return Promise.resolve(stage);
  }
  
  @Post('/{id}/deploy')
  @Security('jwt')
  public async deploy(
    @Request() request: exRequest,
    @Path('id') id: number
  ): Promise<Stage> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOne({
      relations:['application', 'application.trafficConfigs', 'metas', 'metas.service'],
      where: {
        id: id,
        userId: request.user.id
      }
    })

    if(!stage) { throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND); }
    if(stage.status !== StageStatus.LOADED) { throw new ApplicationError(400, ERROR_CODE.STAGE.STAGE_NOT_LOADED); }
    stage.status = StageStatus.DEPLOYED;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await InfuserGrpcAppClient.Instance.create(stage);
      await queryRunner.manager.save(stage);
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new ApplicationError(500, err.message);
    } finally {
      await queryRunner.release();
    }

    this.setStatus(201);
    return Promise.resolve(stage);
  }

  @Post('/{id}/undeploy')
  @Security('jwt')
  public async undeploy(
    @Request() request: exRequest,
    @Path('id') id: number
  ): Promise<Stage> {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOneOrFail({
      relations:['application'],
      where: {
        id: id,
        userId: request.user.id
      }
    })

    if(!stage) { throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND); }
    if(stage.status !== StageStatus.DEPLOYED) { throw new ApplicationError(400, ERROR_CODE.STAGE.STAGE_NOT_DEPLOYED); }

    stage.status = StageStatus.LOADED;
    
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await InfuserGrpcAppClient.Instance.destroy(stage);
      await queryRunner.manager.save(stage);
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new ApplicationError(500, err.message);
    } finally {
      await queryRunner.release();
    }
    
    this.setStatus(201);
    return Promise.resolve(stage);
  }

  @Delete('/{id}')
  @Security('jwt')
  public async delete(
    @Request() request: exRequest,
    @Path('id') id: number
  ) {
    const stageRepo = getRepository(Stage);

    const stage = await stageRepo.findOneOrFail({
      where: {
        id: id,
        userId: request.user.id
      }
    })

    if(!stage) { throw new ApplicationError(404, ERROR_CODE.STAGE.STAGE_NOT_FOUND); }
    if(stage.status === StageStatus.DEPLOYED) { throw new ApplicationError(400, ERROR_CODE.STAGE.DEPLOYED_STAGE_CANNOT_BE_DELETED); }

    await stageRepo.remove(stage);
    
    return Promise.resolve(stage);
  }
}