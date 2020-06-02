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

      res.render("apis/new", {
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
    const { method, entityName, description } = req.body;

    try {
      const application = await applicationRepo.findOneOrFail(id);
      const newApi = new Api();
      newApi.method = method;
      newApi.entityName = entityName;
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

  static getApiShow = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const { id, apiId } = req.params;
    
    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["application", "meta", "meta.columns"],
        where: {
          id: apiId
        }
      });
      const application = api.application;
      res.render("apis/show", {
        current_user: req.user,
        application: application,
        api: api
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getApiEdit = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const { id, apiId } = req.params;
    
    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["application"],
        where: {
          id: apiId
        }
      });
      const application = api.application;
      res.render("apis/edit", {
        current_user: req.user,
        application: application,
        api: api
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static putApi = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const { apiId } = req.params;
    const { method, entityName, description } = req.body;
    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["application"],
        where: {
          id: apiId
        }
      });
      api.method = method;
      api.entityName = entityName;
      api.description = description;
      await apiRepo.save(api);

      res.redirect(`/applications/${api.application.id}/apis/${api.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiController;