import { Request, Response, NextFunction, Router } from "express";
import { getRepository, getConnection, getManager, FindManyOptions } from "typeorm";
import { Application } from "../../entity/manager/Application";

export default class RestController {
  public path = '/rest';
  public router = Router();

  constructor() {
    this.initialRoutes();
  }

  public initialRoutes() {
    this.router.get("/applications", this.getApplications);

  }
  
  getApplications = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    let page = Number(req.query.page);
    let perPage = Number(req.query.perPage);
    if(!page) page = 1;
    if(!perPage) perPage = 10;

    try {
      const findOption:FindManyOptions = {
        relations: ["services", "services.columns"],
        skip: perPage*(page - 1),
        take: perPage,
        order: {
          id: 'ASC'
        }
      }
      const applications = await applicationRepo.findAndCount(findOption)
      res.json(new ApiResponse("", {
        totalCount: applications[1],
        page: page,
        perPage: perPage,
        applications: applications[0]
      }));
    } catch (err) {
      console.error(err);
      res.status(503).json(new ApiResponse("", undefined, err));
      return;
    }
  }
}

class ApiResponse {
  message: String = ""
  code: number
  data: any
  error: Error

  constructor(message?: string, data?: any, error?: Error) {
    if(message) this.message = message;
    if(data) this.data = data;
    if(error) this.error = error;
  }

  get json(): {} {
    const json = {}
    if(this.error) {
      json["code"] = "0001";
      json["message"] = this.error.message;
    } else {
      json["data"] = this.data
      json["message"] = this.message
    }
    return json;
  }
}