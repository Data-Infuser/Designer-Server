import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";
import { Tags, Route, Post, Security, Request, Body } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";

@Route("/api/services")
@Tags("Service")
export class ApiServiceController {

  @Post("/")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    return new Promise(async function(resolve, reject) {
      console.log(request.body);
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
}

interface ServiceParams {
  method: string,
  entityName: string,
  description: string,
  applicationId: number
}