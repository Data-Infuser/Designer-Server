import { Request, Response, NextFunction } from "express";
import { getConnection, LessThanOrEqual, getRepository, getManager, TableColumn, Table, Column } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";
import { Service, ServiceStatus } from "../entity/manager/Service";
import ApplicationError from "../ApplicationError";
import { MetaLoader } from "../util/MetaLoader";
import * as multiparty from 'multiparty';
import { MetaInfo } from "../interfaces/MetaInfo";
import { Application } from "../entity/manager/Application";

class MetaController {

  static postMetaMultipart = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const metaColRepo = getRepository(MetaColumn);
    const serviceRepo = getRepository(Service);
    const { id, apiId } = req.params;
    
    const promisifyUpload = (req) => new Promise<any>((resolve, reject) => {
      const multipartyOption = {
        autoFiles: true,
        uploadDir: __dirname + "/../../upload"
      }
      const form = new multiparty.Form(multipartyOption);     
      form.parse(req, function(err, fields, files) {
          if (err) return reject(err);
          return resolve({
            files: files,
            fields: fields
          });
      });
    });
    const formData = await promisifyUpload(req);

    console.log('after promisifyUpload');
    console.log(formData);
    const dataType = formData.fields.dataType[0]
    try {
      let result: MetaInfo;
      switch(dataType) {
        case 'file':
          result = await MetaLoader.loadMetaFromFile(formData);
          break;
        case 'dbms':
          result = await MetaLoader.loadMetaFromDBMS(formData);
          break;
        default:
          throw new Error(`available dataType ${dataType}`);
      }
      const service = await serviceRepo.findOneOrFail(apiId);
      result.meta.user = req.user;
      result.meta.service = service;
      service.meta = result.meta;
      service.status = ServiceStatus.METALOADED;
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(result.meta);
        await metaColRepo.save(result.columns);
        await serviceRepo.save(service);
      })
      res.redirect(`/applications/${id}/services/${apiId}`);
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getNew = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const serviceRepo = getRepository(Service);
    const { id, apiId } = req.params;
    try {
      const application = await applicationRepo.findOneOrFail(id);
      const service = await serviceRepo.findOneOrFail(apiId);

      res.render("metas/new.pug", {
        current_user: req.user,
        service: service,
        application: application
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getEdit = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const { id } = req.params
    try {
      const meta = await metaRepo.findOneOrFail({
        relations: ["columns", "service", "service.application"],
        where: {
          id: id
        }
      })
      res.render("metas/edit.pug", {
        current_user: req.user,
        meta: meta,
        service: meta.service,
        application: meta.service.application
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static delete = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const serviceRepo = getRepository(Service);
    const { id } = req.params;
    try {
      const meta = await metaRepo.findOneOrFail({
        relations: ["service", "service.application"],
        where: {
          id: id
        }
      });
      const serviceId = meta.service.id;
      const applicationId = meta.service.application.id;
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.delete(id);
        if(meta.service && meta.service.tableName) {
          meta.service.tableName = null;
          meta.service.status = ServiceStatus.IDLE;
          await serviceRepo.save(meta.service);
          await getConnection('dataset').createQueryRunner().dropTable(meta.service.tableName, true);
        }
      });
      
      req.flash('danger', '메타 정보가 삭제되었습니다.');
      res.redirect(`/applications/${applicationId}/services/${serviceId}`)
    } catch (err) {
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static put =  async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const columnRepo = getRepository(MetaColumn);
    const { id } = req.params;
    const { title } = req.body;
    try {
      const meta = await metaRepo.findOneOrFail({
        relations: ["columns", "service", "service.application"],
        where: {
          id: id
        }
      })

      meta.title = title;
      meta.columns.forEach(col => {
        const colName = req.body[`col-${col.id}`];
        const type = req.body[`type-${col.id}`];
        const size = req.body[`size-${col.id}`];

        if(colName) col.columnName = colName;
        if(type) col.type = type;
        if(size) col.size = size;
      });

      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(meta);
        await columnRepo.save(meta.columns);
      });
    
      req.flash('success', '수정되었습니다.')
      res.redirect(`/applications/${meta.service.application.id}/services/${meta.service.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default MetaController;