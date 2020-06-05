import { Request, Response, NextFunction, Router } from "express";
import { getRepository, getConnection, getManager, Table } from "typeorm";
import ApplicationError from "../ApplicationError";
import { Application, ApplicationStatus } from "../entity/manager/Application";
import { User } from "../entity/manager/User";
import { Service, ServiceStatus } from "../entity/manager/Service";
import { ServiceColumn } from "../entity/manager/ServiceColumn";
import { TableOptions } from "typeorm/schema-builder/options/TableOptions";
import { RowGenerator } from "../util/RowGenerator";
import { SwaggerBuilder } from "../util/SwaggerBuilder";
import swagger from "swagger-ui-express";
import { needAuth } from "../middlewares/checkAuth";
import MetaController from "./MetaController";

class ApplicationController {

  public path = '/applications';
  public router = Router();

  private metaController: MetaController;

  constructor(metaController: MetaController) {
    this.metaController = metaController;
    this.initialRoutes();
  }

  public initialRoutes() {
    this.router.get("/", needAuth, this.getIndex);
    this.router.get("/new", needAuth, this.getNew);
    this.router.post("/", needAuth, this.post);
    this.router.get("/:id", needAuth, this.getShow);
    this.router.post("/:id/deploy", needAuth, this.deployApplication);
    this.router.use("/:id/api-docs", swagger.serve);
    this.router.get("/:id/api-docs", swagger.serve, this.getApiDocs);
    //Apis
    this.router.get("/:id/services/new", needAuth, this.getApiNew);
    this.router.post("/:id/services", needAuth, this.postApi);
    this.router.get("/:id/services/:apiId", needAuth, this.getApiShow);
    this.router.put("/:id/services/:apiId", needAuth, this.putApi);
    this.router.get("/:id/services/:apiId/edit", needAuth, this.getApiEdit);
    //metas
    this.router.get("/:id/services/:apiId/meta/new", needAuth, this.metaController.getNew);
    this.router.post("/:id/services/:apiId/meta", needAuth, this.metaController.postMetaMultipart);
  }

  getIndex = async(req: Request, res: Response, next: NextFunction) => {
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

  getNew = async(req: Request, res: Response, next: NextFunction) => {
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

  getShow = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const { id } = req.params;
    try {
      const application = await applicationRepo.findOne({
        relations: ["services", "services.meta"],
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

  post = async(req: Request, res: Response, next: NextFunction) => {
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

  getApiNew = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const { id } = req.params;
    try {
      const application = await applicationRepo.findOneOrFail(id);

      res.render("services/new", {
        current_user: req.user,
        application: application
      });

    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  postApi = async(req:Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const serviceRepo = getRepository(Service);
    const { id } = req.params;
    const { method, entityName, description } = req.body;

    try {
      const application = await applicationRepo.findOneOrFail(id);
      const newService = new Service();
      newService.method = method;
      newService.entityName = entityName;
      newService.description = description;
      newService.application = application;
      await serviceRepo.save(newService);

      res.redirect(`/applications/${application.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  getApiShow = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const { id, apiId } = req.params;
    
    try {
      const service = await serviceRepo.findOneOrFail({
        relations: ["application", "meta", "meta.columns"],
        where: {
          id: apiId
        }
      });
      const application = service.application;
      res.render("services/show", {
        current_user: req.user,
        application: application,
        service: service
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  getApiEdit = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const { id, apiId } = req.params;
    
    try {
      const service = await serviceRepo.findOneOrFail({
        relations: ["application"],
        where: {
          id: apiId
        }
      });
      const application = service.application;
      res.render("services/edit", {
        current_user: req.user,
        application: application,
        service: service
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  putApi = async(req: Request, res: Response, next: NextFunction) => {
    const serviceRepo = getRepository(Service);
    const { apiId } = req.params;
    const { method, entityName, description } = req.body;
    try {
      const service = await serviceRepo.findOneOrFail({
        relations: ["application"],
        where: {
          id: apiId
        }
      });
      service.method = method;
      service.entityName = entityName;
      service.description = description;
      await serviceRepo.save(service);

      res.redirect(`/applications/${service.application.id}/services/${service.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  deployApplication = async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const defaultQueryRunner = await getConnection().createQueryRunner();
    const datasetQueryRunner = await getConnection('dataset').createQueryRunner();
    const { id } = req.params;
    let tablesForDelete:string[] = [];
    try {
      const application = await applicationRepo.findOneOrFail({
        relations: ["services", "services.meta", "services.meta.columns"],
        where: {
          id: id
        }
      })
      await defaultQueryRunner.startTransaction();
      await datasetQueryRunner.startTransaction();
      for(let service of application.services) {
        const meta = service.meta;
        const metaColumns = meta.columns;
        service.tableName = application.nameSpace + "-" + service.entityName
        // column data 생성
        let columns = []
        let columnNames = []
        let originalColumnNames = []
        let serviceColumns: ServiceColumn[] = []

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
          serviceColumns.push(new ServiceColumn(column.columnName, type, service));
        });

        const tableOption: TableOptions = {
          name: service.tableName,
          columns: columns
        }
        
        let insertQuery = `INSERT INTO \`${tableOption.name}\`(${columnNames.join(",")}) VALUES ?`;
  
        /**
         * TODO: getRows 와 같이 범용적인 함수를 만들고, 함수 내부에서 data type을 확인 후 RDBMS, CSV 등을 읽어오도록 구현
         */
        let insertValues = await RowGenerator.generateRows(meta, originalColumnNames);
        console.log(insertValues);
        tablesForDelete.push(tableOption.name);
        service.columnLength = serviceColumns.length;
        service.dataCounts = insertValues.length;

        await datasetQueryRunner.createTable(new Table(tableOption));
        await datasetQueryRunner.query(insertQuery, [insertValues]);
        meta.isActive = true;
        service.status = ServiceStatus.LOADED;
        await defaultQueryRunner.manager.save(meta);
        await defaultQueryRunner.manager.save(service);
        await defaultQueryRunner.manager.save(serviceColumns);
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

  getApiDocs= async(req: Request, res: Response, next: NextFunction) => {
    const applicationRepo = getRepository(Application);
    const { id } = req.params;
    try {
      const application = await applicationRepo.findOneOrFail({
        relations: ["services"],
        where: {
          id: id
        }
      })

      const apiDoc = await SwaggerBuilder.buildApplicationDoc(application);
      if(apiDoc) {
        res.send(swagger.generateHTML(apiDoc));
      }
    } catch (err) {
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApplicationController;