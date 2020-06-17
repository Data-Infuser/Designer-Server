import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";
import { Tags, Route, Post, Security, Request, Body } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";

@Route("/api/oauth")
@Tags("Service")
class ApiServiceController {

  @Post("/")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Body() serviceParams: ServiceParams
  ): Promise<Service> {
    return new Promise(async function(resolve, reject) {
      const applicationRepo = getRepository(Service);
      const { method, entityName, description, applicationId } = serviceParams;
      try {
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

export default ApiServiceController;