import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions, FindManyOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";
import { Tags, Route, Post, Security, Request, Body, Delete, Path, Get, Query } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";
import RestResponse from './RestResponse';

@Route("/rest/applications")
@Tags("Rest Applications")
export class RestApplicationController {
  @Get("/")
  public async get(
    @Query() page?: number,
    @Query() perPage?: number
  ) {
    if(!page) page = 1;
    if(!perPage) perPage = 10;

    return new Promise(async function(resolve, reject) {
      const appRepo = getRepository(Application);
      const findOption:FindManyOptions = {
        relations: ["services", "services.columns"],
        skip: perPage*(page - 1),
        take: perPage,
        order: {
          id: 'ASC'
        }
      }
      try {
        const applications = await appRepo.findAndCount(findOption);
        resolve(new RestResponse("", {
          totalCount: applications[1],
          page: page,
          perPage: perPage,
          applications: applications[0]
        }));
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }
}