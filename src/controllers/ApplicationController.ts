import { Request, Response, NextFunction } from "express";
import { getRepository, getConnection, getManager, Table } from "typeorm";
import ApplicationError from "../ApplicationError";
import { Application, ApplicationStatus } from "../entity/manager/Application";
import { User } from "../entity/manager/User";
import { Api, ServiceStatus } from "../entity/manager/Api";
import { ApiColumn } from "../entity/manager/ApiColumns";
import { TableOptions } from "typeorm/schema-builder/options/TableOptions";
import { RowGenerator } from "../util/RowGenerator";



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
        relations: ["apis", "apis.meta"],
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

  static deployApplication = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const defaultQueryRunner = await getConnection().createQueryRunner();
    const datasetQueryRunner = await getConnection('dataset').createQueryRunner();
    const { id } = req.params;
    let tablesForDelete:string[] = [];
    try {
      const application = await applicationRepo.findOneOrFail({
        relations: ["apis", "apis.meta", "apis.meta.columns"],
        where: {
          id: id
        }
      })
      await defaultQueryRunner.startTransaction();
      await datasetQueryRunner.startTransaction();
      for(let api of application.apis) {
        const meta = api.meta;
        const metaColumns = meta.columns;
        api.tableName = application.nameSpace + "-" + api.entityName
        // column data 생성
        let columns = []
        let columnNames = []
        let originalColumnNames = []
        let apiColumns: ApiColumn[] = []

        metaColumns.forEach(column => {
          columnNames.push(`\`${column.columnName}\``)
          originalColumnNames.push(`\`${column.originalColumnName}\``)
          let type = column.type.toString();
          if(column.size) {
            type = `${type}(${column.size})`
          }
          columns.push({
            name: column.columnName,
            type: column.type,
            isNullable: true
          })
          apiColumns.push(new ApiColumn(column.columnName, type, api));
        });

        const tableOption: TableOptions = {
          name: api.tableName,
          columns: columns
        }
        
        let insertQuery = `INSERT INTO \`${tableOption.name}\`(${columnNames.join(",")}) VALUES ?`;
  
        /**
         * TODO: getRows 와 같이 범용적인 함수를 만들고, 함수 내부에서 data type을 확인 후 RDBMS, CSV 등을 읽어오도록 구현
         */
        let insertValues = await RowGenerator.generateRows(meta, originalColumnNames);
        console.log(insertValues);
        tablesForDelete.push(tableOption.name);
        api.columnLength = apiColumns.length;
        api.dataCounts = insertValues.length;

        await datasetQueryRunner.createTable(new Table(tableOption));
        await datasetQueryRunner.query(insertQuery, [insertValues]);
        meta.isActive = true;
        api.status = ServiceStatus.LOADED;
        await defaultQueryRunner.manager.save(meta);
        await defaultQueryRunner.manager.save(api);
        await defaultQueryRunner.manager.save(apiColumns);
      }
      application.status = ApplicationStatus.DEPLOYED;
      await defaultQueryRunner.manager.save(application);
      await defaultQueryRunner.commitTransaction();
      await datasetQueryRunner.commitTransaction();
      await defaultQueryRunner.release();
      await datasetQueryRunner.release();
      res.redirect(`/applications/${id}`)
    } catch (err) {
      tablesForDelete.forEach(async table => {
        await getConnection('dataset').createQueryRunner().dropTable(table, true);
      })
      await defaultQueryRunner.rollbackTransaction();
      await datasetQueryRunner.rollbackTransaction();
      await defaultQueryRunner.release();
      await datasetQueryRunner.release();
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiController;