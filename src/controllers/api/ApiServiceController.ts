import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";
import { Tags, Route, Post, Security, Request, Body, Delete, Path, Put } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";
import { FileParams, DbmsParams } from './ApiMetaController';
import MetaLoadStrategy from "../../lib/MetaLoadStrategy";
import MysqlMetaLoadStrategy from "../../lib/strategies/MysqlMetaLoadStrategy";
import CubridMetaLoadStrategy from "../../lib/strategies/CubridMetaLoadStrategy";
import MetaLoader from "../../lib/MetaLoader";

@Route("/api/services")
@Tags("Service")
export class ApiServiceController {

  @Post("/")
  @Security("jwt")
  public async post(
    @Request() request: exRequest,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    return new Promise(async function(resolve, reject) {
      const serviceRepo = getRepository(Service);
      const applicationRepo = getRepository(Application);
      const { method, entityName, description, applicationId } = serviceParams;
      if(method.length == 0 || entityName.length == 0 || description.length == 0 || !applicationId) {
        reject(new ApplicationError(400, "Need all params"));
      }
      
      try {
        const newService = new Service();
        newService.application = await applicationRepo.findOneOrFail(applicationId);
        newService.method = method;
        newService.entityName = entityName;
        newService.description = description;
        newService.user = request.user;
        await serviceRepo.save(newService);
        resolve(newService);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
        return;
      }
    });
  }

  @Put("/{serviceId}")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Path() serviceId: number,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    return new Promise(async function(resolve, reject) {
      const serviceRepo = getRepository(Service);
      const { method, entityName, description } = serviceParams;
      if(method.length == 0 || entityName.length == 0 || description.length == 0 ) {
        reject(new ApplicationError(400, "Need all params"));
      }
      try {
        console.log(serviceParams);
        const service = await serviceRepo.findOneOrFail({
          relations: ["meta", "meta.columns"],
          where: {
            id: serviceId
          }
        });
        service.method = method;
        service.entityName = entityName;
        service.description = description;
        await serviceRepo.save(service);
        resolve(service);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
        return;
      }
    });
  }

  @Delete("/{serviceId}")
  @Security("jwt")
  public async delete(
    @Request() request: exRequest,
    @Path() serviceId: number
  ): Promise<any> {
    return new Promise(async function(resolve, reject) {
      const serviceRepo = getRepository(Service);
      try {
        const service = await serviceRepo.findOneOrFail({
          relations: ["application", "meta"],
          where: {
            id: serviceId,
            user: {
              id: request.user.id
            }
          }
        })
        const applicationId = service.application.id;
        await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
          if(service.meta) await transactionalEntityManager.remove(service.meta);
          await transactionalEntityManager.remove(service);
        });
        resolve({
          message: "delete success",
          serviceId: serviceId,
          applicationId: applicationId
        })
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
        return;
      }
    });
  }
}

interface ServiceParams {
  method: string,
  entityName: string,
  description: string,
  applicationId?: number,
  fileParams?: FileParams,
  dbmsParams?: DbmsParams
}