import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions, FindManyOptions, FindOneOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";
import { Tags, Route, Post, Security, Request, Body, Delete, Path, Get, Query } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";
import RestResponse from './RestResponse';

@Route("/rest/services")
@Tags("#Services")
export class RestServiceController {
  @Get("/")
  public async get(
    @Query() page?: number,
    @Query() perPage?: number
  ) {
    if(!page) page = 1;
    if(!perPage) perPage = 10;

    return new Promise(async function(resolve, reject) {
      const serviceRepo = getRepository(Service);
      const findOption:FindManyOptions = {
        relations: ["application", "columns"],
        skip: perPage*(page - 1),
        take: perPage,
        order: {
          id: 'ASC'
        }
      }
      try {
        const services = await serviceRepo.findAndCount(findOption);
        resolve(new RestResponse("", {
          totalCount: services[1],
          page: page,
          perPage: perPage,
          services: services[0]
        }));
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  @Get("/:id")
  public async getDetail(
    @Path("id") id: number
  ) {
    return new Promise(async function(resolve, reject) {
      const serviceRepo = getRepository(Service);
      const findOption:FindOneOptions = {
        relations: ["application", "columns"],
        where: {
          id: id
        }
      }
      try {
        const service = await serviceRepo.findOneOrFail(findOption);
        resolve(new RestResponse("", {
          service: service
        }));
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }
}