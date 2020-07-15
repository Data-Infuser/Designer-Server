import { getRepository, FindManyOptions, FindOneOptions, Like } from "typeorm";
import { Tags, Route, Path, Get, Query } from "tsoa";
import { Service } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import RestResponse from './RestResponse';

@Route("/rest/services")
@Tags("#Services")
export class RestServiceController {
  @Get("/")
  public async get(
    @Query() page?: number,
    @Query() perPage?: number,
    @Query() entityName?: string,
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
        },
        where: {}
      }

      if (entityName) {
        findOption.where["entityName"] = Like(`%${entityName}%`);
      }
      console.log(findOption);
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