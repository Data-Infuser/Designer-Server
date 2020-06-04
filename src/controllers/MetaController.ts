import { Request, Response, NextFunction } from "express";
import { getConnection, LessThanOrEqual, getRepository, getManager, TableColumn, Table, Column } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";
import { User } from "../entity/manager/User";
import { TableOptions } from "typeorm/schema-builder/options/TableOptions";
import { Api, ServiceStatus } from "../entity/manager/Api";
import ApplicationError from "../ApplicationError";
import { ApiColumn } from "../entity/manager/ApiColumns";
import { RowGenerator } from "../util/RowGenerator";
import { MetaLoader } from "../util/MetaLoader";
import * as multiparty from 'multiparty';
import { MetaInfo } from "../interfaces/MetaInfo";
import { Application } from "../entity/manager/Application";

class MetaController {

  static postMetaMultipart = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const metaColRepo = getRepository(MetaColumn);
    const apiRepo = getRepository(Api);
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
      const api = await apiRepo.findOneOrFail(apiId);
      result.meta.user = req.user;
      result.meta.api = api;
      api.meta = result.meta;
      api.status = ServiceStatus.METALOADED;
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(result.meta);
        await metaColRepo.save(result.columns);
        await apiRepo.save(api);
      })
      res.redirect(`/applications/${id}/apis/${apiId}`);
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getNew = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const apiRepo = getRepository(Api);
    const { id, apiId } = req.params;
    try {
      const application = await applicationRepo.findOneOrFail(id);
      const api = await apiRepo.findOneOrFail(apiId);

      res.render("metas/new.pug", {
        current_user: req.user,
        api: api,
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
        relations: ["columns", "api", "api.application"],
        where: {
          id: id
        }
      })
      res.render("metas/edit.pug", {
        current_user: req.user,
        meta: meta,
        api: meta.api,
        application: meta.api.application
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static delete = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const apiRepo = getRepository(Api);
    const { id } = req.params;
    try {
      const meta = await metaRepo.findOneOrFail({
        relations: ["api", "api.application"],
        where: {
          id: id
        }
      });
      const apiId = meta.api.id;
      const applicationId = meta.api.application.id;
      console.log(meta.api);
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.delete(id);
        if(meta.api && meta.api.tableName) {
          meta.api.tableName = null;
          meta.api.status = ServiceStatus.IDLE;
          await apiRepo.save(meta.api);
          await getConnection('dataset').createQueryRunner().dropTable(meta.api.tableName, true);
        }
      });
      
      req.flash('danger', '메타 정보가 삭제되었습니다.');
      res.redirect(`/applications/${applicationId}/apis/${apiId}`)
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
        relations: ["columns", "api", "api.application"],
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
      res.redirect(`/applications/${meta.api.application.id}/apis/${meta.api.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default MetaController;