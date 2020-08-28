import { Request as exRequest } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { Tags, Route, Post, Security, Request, Body, Delete, Path, Put } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";
import { FileParams, DbmsParams } from './ApiMetaController';

@Route("/api/services")
@Tags("Service")
export class ApiServiceController {

  @Post("/")
  @Security("jwt")
  public async post(
    @Request() request: exRequest,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    const serviceRepo = getRepository(Service);
    const applicationRepo = getRepository(Application);
    const { method, entityName, description, applicationId } = serviceParams;
    if(method.length == 0 || entityName.length == 0 || description.length == 0 || !applicationId) {
      throw new ApplicationError(400, "Need all params");
    }
    
    const newService = new Service();
    newService.application = await applicationRepo.findOneOrFail(applicationId);
    newService.method = method;
    newService.entityName = entityName;
    newService.description = description;
    newService.userId = request.user.id;
    await serviceRepo.save(newService);
    
    return Promise.resolve(newService);
  }

  @Put("/{serviceId}")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Path() serviceId: number,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    const serviceRepo = getRepository(Service);
    const { method, entityName, description } = serviceParams;
    if(method.length == 0 || entityName.length == 0 || description.length == 0 ) {
      throw new ApplicationError(400, "Need all params");
    }

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
    
    return Promise.resolve(service);
  }

  @Delete("/{serviceId}")
  @Security("jwt")
  public async delete(
    @Request() request: exRequest,
    @Path() serviceId: number
  ): Promise<any> {
    const serviceRepo = getRepository(Service);
    const service = await serviceRepo.findOneOrFail({
      relations: ["application", "meta"],
      where: {
        id: serviceId,
        userId: request.user.id
      }
    })

    const applicationId = service.application.id;
    await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
      if(service.meta) await transactionalEntityManager.remove(service.meta);
      await transactionalEntityManager.remove(service);
    });

    return Promise.resolve({
      message: "delete success",
      serviceId: serviceId,
      applicationId: applicationId
    })      
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