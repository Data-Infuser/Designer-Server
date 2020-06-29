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
    let perpage = Number(req.query.perpage);
    if(!page) page = 1;
    if(!perpage) perpage = 10;

    try {
      const findOption:FindManyOptions = {
        relations: ["services", "services.columns"],
        skip: perpage*(page - 1),
        take: perpage,
        order: {
          id: 'ASC'
        }
      }
      const applications = await applicationRepo.find(findOption)
      res.json(new ApiResponse("", applications));
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