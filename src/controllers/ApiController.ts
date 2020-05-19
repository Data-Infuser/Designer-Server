import { Request, Response, NextFunction } from "express";
import { Api } from "../entity/manager/Api";
import { getRepository, getConnection, getManager } from "typeorm";
import ApplicationError from "../ApplicationError";
import { Meta } from "../entity/manager/Meta";
import { ApiColumn } from "../entity/manager/ApiColumns";

class ApiController {
  static getIndex = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);

    try {
      const apis = await apiRepo.find();

      res.render("apis/index.pug", {
        apis: apis,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const { id } = req.params

    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["columns", "meta"],
        where: {
          id: id
        }
      });

      res.render("apis/show.pug", {
        api: api,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getEdit = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const { id } = req.params;

    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["columns", "meta"],
        where: {
          id: id
        }
      });
      
      res.render("apis/edit.pug", {
        api: api,
        current_user: req.user
      });
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static put = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const apiColRepo = getRepository(ApiColumn);
    const { id } = req.params;

    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["columns", "meta"],
        where: {
          id: id
        }
      });

      api.columns.forEach(col => {
        col.hidden = req.body[`hidden-${col.id}`] == 'true'
      })

      await apiColRepo.save(api.columns);

      res.redirect(`/apis/${api.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static delete = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const metaRepo = getRepository(Meta);
    const { id } = req.params;
    try {
      let api = await apiRepo.findOneOrFail({
        relations: ["meta"],
        where: {
          id: id
        }
      });
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await apiRepo.delete(api.id);
        api.meta.isActive = false;
        await metaRepo.save(api.meta);
        await getConnection('dataset').createQueryRunner().dropTable(api.tableName, true);
      });
      
      req.flash('danger', 'api가 삭제되었습니다.');
      res.redirect('/apis')
    } catch (err) {
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiController;