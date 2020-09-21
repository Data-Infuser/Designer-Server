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
        id: stageId
      }
    })

    if(!stage) {
      throw new ApplicationError(404, "Stage Not Found");
    }

    return stage;
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
        id: stageId
      }
    })

    if(!stage) {
      throw new ApplicationError(404, "Stage Not Found");
    } else if(!stage.metas.every( meta => meta.status === MetaStatus.METALOADED)) {
      throw new ApplicationError(400, "Meta should be loaded before load data");
    } else if(!stage.metas.every( meta => meta.service !== null)) {
      throw new ApplicationError(400, "All metas should have service before load data");
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

    const stage = await stageRepo.findOneOrFail({
      relations:['application'],
      where: {
        id: id
      }
    })

    if(stage.application.userId !== request.user.id) throw new ApplicationError(404, 'Not Found');
    if(stage.status !== StageStatus.LOADED) throw new ApplicationError(400, 'Bad Request')
    stage.status = StageStatus.DEPLOYED;
    await stageRepo.save(stage);

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
        id: id
      }
    })

    if(stage.application.userId !== request.user.id) throw new ApplicationError(404, 'Not Found');
    if(stage.status !== StageStatus.DEPLOYED) throw new ApplicationError(400, 'Bad Request');

    stage.status = StageStatus.LOADED;
    await stageRepo.save(stage);

    return Promise.resolve(stage);
  }

  // @Delete('/{id}')
  // @Security('jwt')
  // public async delete(
  //   @Request() request: exRequest,
  //   @Path('id') id: number
  // ): Promise<any> {
  //   const stageRepo = getRepository(Stage);

  //   const stage = await stageRepo.findOneOrFail({
  //     relations:['application', 'services', 'services.meta'],
  //     where: {
  //       id: id
  //     }
  //   })

  //   const files = []
  //   stage.services.forEach(service => {
  //     if(service.meta && service.meta.dataType === "file") {
  //       files.push(service.meta.filePath);
  //     }
  //   });

  //   if(stage.application.userId !== request.user.id) throw new ApplicationError(404, 'Not Found');
  //   if(stage.status === StageStatus.DEPLOYED) throw new ApplicationError(400, 'Bad Request');
  //   await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
  //     await transactionalEntityManager.remove(stage.services);
  //     await transactionalEntityManager.remove(stage);
  //     if(files.length > 0) {
  //       files.forEach(file => {
  //         fs.unlink(file, (err) => {
  //           console.error(`${file} Unlink Failed`)
  //           console.error(err);
  //         })
  //       })
  //     }
  //   })
  //   stage.id = id;
    
  //   return Promise.resolve(stage);
  // }
}