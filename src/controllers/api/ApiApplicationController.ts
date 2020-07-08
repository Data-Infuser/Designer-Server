import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import { DatabaseConnection, AcceptableDbms } from "../../entity/manager/DatabaseConnection";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Put } from "tsoa";
import { Request as exRequest } from "express";
import { Application } from "../../entity/manager/Application";
import ApplicationError from "../../ApplicationError";

@Route("/api/applications")
@Tags("Applications")
export class ApiApplicationController {

  @Get("/")
  @Security("jwt")
  public async get(
    @Request() request: exRequest
  ){
    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
    try {
      const apps = await appRepo.find({
        where: {
          user: {
            id: request.user.id
          }
        }
      });
      resolve(apps);
    } catch (err) {
      console.error(err);
      reject(new ApplicationError(500, err.message));
    }
    });
  }

  @Get("/{applicationId}")
  @Security("jwt")
  public async getDetail(
    @Path() applicationId: number,
    @Request() request: exRequest
  ){
    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
    try {
      const app = await appRepo.findOneOrFail({
        relations: ["services", "services.meta", "services.meta.columns"],
        where: {
          id: applicationId,
          user: {
            id: request.user.id
          }
        }
      });
      console.log(app);
      resolve(app);
    } catch (err) {
      console.error(err);
      reject(new ApplicationError(500, err.message));
    }
    });
  }

  @Post("/")
  @Security("jwt")
  public async put(
    @Request() request: exRequest,
    @Body() applicationParams: ApplicationParams
  ): Promise<Application> {
    return new Promise(async function(resolve, reject) {
      const applicationRepo = getRepository(Application);
      const { namespace, title, description } = applicationParams;
      try {
        const newApplication = new Application();
        newApplication.nameSpace = namespace;
        newApplication.title = title;
        newApplication.description = description;
        newApplication.user = request.user;
        await applicationRepo.save(newApplication);

        resolve(newApplication);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }

  @Post("/{id}/save")
  @Security("jwt")
  public async save(
    @Path("id") id: number,
    @Body() applicationSavePrams: any
  ): Promise<Application> {
    return new Promise(async (resolve, reject) => {
      const applicationRepo = getRepository(Application);
      console.log(applicationSavePrams);
      try {
        const application = await applicationRepo.findOneOrFail(id)
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }
}

interface ApplicationParams {
  namespace: string,
  title: string,
  description: string
}