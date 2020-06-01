import { Request, Response, NextFunction } from "express";
import { getRepository, getConnection, getManager } from "typeorm";
import ApplicationError from "../ApplicationError";
import { Application } from "../entity/manager/Application";
import { User } from "../entity/manager/User";
import { Api } from "../entity/manager/Api";



class ApiController {
  static getIndex = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    try {
      const applications = await applicationRepo.find({
        where: {
          user: {
            id: (<User>req.user).id
          }
        }
      })
      res.render("applications/index.pug", {
        applications: applications,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getNew = async(req: Request, res: Response, next: NextFunction) => {
    try {
      res.render("applications/new.pug", {
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const { id } = req.params;
    try {
      const application = await applicationRepo.findOne({
        relations: ["apis"],
        where: {
          id: id,
          user: {
            id: req.user.id
          }
        }
      })

      if(!application) {
        next(new ApplicationError(404, "Cannot find application"));
      }

      res.render("applications/show.pug", {
        current_user: req.user,
        application: application
      })


    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static post = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const { nameSpace, title, description } = req.body;
    try {
      const newApplication = new Application();
      newApplication.nameSpace = nameSpace;
      newApplication.title = title;
      newApplication.description = description;
      newApplication.user = req.user;
      await applicationRepo.save(newApplication);

      res.redirect("/applications")
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getApiNew = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const { id } = req.params;
    try {
      const application = await applicationRepo.findOneOrFail(id);

      res.render("applications/apis/new", {
        current_user: req.user,
        application: application
      });

    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static postApi = async(req:Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const apiRepo = getRepository(Api);
    const { id } = req.params;
    const { method, endPoint, description } = req.body;

    try {
      const application = await applicationRepo.findOneOrFail(id);
      const newApi = new Api();
      newApi.method = method;
      newApi.entityName = endPoint;
      newApi.description = description;
      newApi.application = application;
      await apiRepo.save(newApi);

      res.redirect(`/applications/${application.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiController;