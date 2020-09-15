import { Request as exRequest } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { Tags, Route, Post, Security, Request, Body, Delete, Path, Put, Controller } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";
import fs from 'fs';
import { Meta } from "../../entity/manager/Meta";
import ServiceParams from "../../interfaces/requestParams/ServiceParams";

@Route("/api/services")
@Tags("Service")
export class ApiServiceController extends Controller{

  @Post("/")
  @Security("jwt")
  public async post(
    @Request() request: exRequest,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    const serviceRepo = getRepository(Service);
    const metaRepo = getRepository(Meta);
    const { metaId, method, entityName, description } = serviceParams;
    if(method.length == 0 || entityName.length == 0 || description.length == 0 || !metaId) {
      throw new ApplicationError(400, "Need all params");
    }

    const meta = await metaRepo.findOneOrFail(metaId);

    if(!meta) { throw new ApplicationError(404, "No Meta Found") }
    
    const newService = new Service();
    newService.method = method;
    newService.entityName = entityName;
    newService.description = description;
    newService.userId = request.user.id;
    newService.meta = meta;

    await serviceRepo.save(newService);

    this.setStatus(201);
    
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

    const filePath = service.meta && service.meta.dataType === 'file' ? service.meta.filePath : null;

    await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
      if(service.meta) await transactionalEntityManager.remove(service.meta);
      await transactionalEntityManager.remove(service);
      if(filePath) {
        fs.unlink(filePath, (err) => {
          console.error(`${filePath} Unlink Failed`)
          console.error(err);
        });
      }
    });

    return Promise.resolve({
      message: "delete success",
      serviceId: serviceId
    })      
  }
}