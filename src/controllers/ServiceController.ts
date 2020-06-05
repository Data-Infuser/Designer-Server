import { Request, Response, NextFunction } from "express";
import { Service } from "../entity/manager/Service";
import { getRepository, getConnection, getManager, Table } from "typeorm";
import ApplicationError from "../ApplicationError";
import { Meta } from "../entity/manager/Meta";
import { ServiceColumn } from "../entity/manager/ServiceColumn";
import { SwaggerBuilder } from "../util/SwaggerBuilder";
import swagger from "swagger-ui-express";
import { MetaColumn } from "../entity/manager/MetaColumn";
import { TableOptions } from "typeorm/schema-builder/options/TableOptions";
import { RowGenerator } from "../util/RowGenerator";
import { Application } from "../entity/manager/Application";


class ServiceController {
  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const { id } = req.params

    try {
      const service = await serviceRepo.findOneOrFail({
        relations: ["columns", "meta"],
        where: {
          id: id
        }
      });

      res.render("services/show.pug", {
        service: service,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getEdit = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const { id } = req.params;

    try {
      const service = await serviceRepo.findOneOrFail({
        relations: ["columns", "meta"],
        where: {
          id: id
        }
      });
      
      res.render("services/edit.pug", {
        service: service,
        current_user: req.user
      });
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static put = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const serviceColRepo = getRepository(ServiceColumn);
    const { id } = req.params;

    try {
      const service = await serviceRepo.findOneOrFail({
        relations: ["columns", "meta"],
        where: {
          id: id
        }
      });

      service.columns.forEach(col => {
        col.hidden = req.body[`hidden-${col.id}`] == 'true'
      })
      await serviceColRepo.save(service.columns);
      res.redirect(`/services/${service.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static delete = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const metaRepo = getRepository(Meta);
    const { id } = req.params;
    try {
      let service = await serviceRepo.findOneOrFail({
        relations: ["meta"],
        where: {
          id: id
        }
      });
      
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await serviceRepo.delete(service.id);
        service.meta.isActive = false;
        await metaRepo.save(service.meta);
        await getConnection('dataset').createQueryRunner().dropTable(service.tableName, true);
      });
      
      req.flash('danger', 'api가 삭제되었습니다.');
      res.redirect('/services')
    } catch (err) {
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiController;