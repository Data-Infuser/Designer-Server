import { Request, Response, NextFunction } from "express";
import { getConnection, LessThanOrEqual, getRepository, getManager, TableColumn, Table, Column } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";
import { User } from "../entity/manager/User";
import { TableOptions } from "typeorm/schema-builder/options/TableOptions";
import { Api } from "../entity/manager/Api";
import ApplicationError from "../ApplicationError";
import { ApiColumn } from "../entity/manager/ApiColumns";
import { RowGenerator } from "../util/RowGenerator";
import { MetaLoader } from "../util/MetaLoader";
import { MetaInfo } from "../util/MetaInfo";
import * as multiparty from 'multiparty';
import { KongClient } from "../client/KongClient";
import { KongService } from "../entity/kong/KongService";

class MetaController {

  static uploadXlsxFile = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const metaColRepo = getRepository(MetaColumn);
    
    const promisifyUpload = (req) => new Promise<any>((resolve, reject) => {
      const multipartyOption = {
        autoFiles: true,
        uploadDir: "/Users/chunghyup/node_workspace/files"
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
      result.meta.user = <User>req.user;
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(result.meta);
        await metaColRepo.save(result.columns);
      })
      res.redirect(`/metas/${result.meta.id}`);
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
  
  static getIndex = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);

    try {
      const metas = await metaRepo.find();

      res.render("metas/index.pug", {
        metas: metas,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getNew = async(req: Request, res: Response, next: NextFunction) => {
    res.render("metas/new.pug", {
      current_user: req.user
    })
  }

  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const { id } = req.params
    try {
      const meta = await metaRepo.findOneOrFail({
        relations: ["columns"],
        where: {
          id: id
        }
      })
      res.render("metas/show.pug", {
        current_user: req.user,
        meta: meta
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
        relations: ["columns"],
        where: {
          id: id
        }
      })
      res.render("metas/edit.pug", {
        current_user: req.user,
        meta: meta
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
        relations: ["api"],
        where: {
          id: id
        }
      });
      console.log(meta.api);
      if(meta.api) {
        await getConnection('dataset').createQueryRunner().dropTable(meta.api.tableName, true);
        await apiRepo.delete(meta.api.id);
      }
      await metaRepo.delete(id);
      req.flash('danger', '메타 정보가 삭제되었습니다.');
      res.redirect('/metas')
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
        relations: ["columns"],
        where: {
          id: id
        }
      })

      meta.title = title;
      meta.columns.forEach(col => {
        const colName = req.body[`col-${col.id}`];
        const type = req.body[`type-${col.id}`];

        if(colName) col.columnName = colName;
        if(type) col.type = type;
      });

      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(meta);
        await columnRepo.save(meta.columns);
      });
    
      req.flash('success', '수정되었습니다.')
      res.redirect(`/metas/${meta.id}`)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getNewApi = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const { id } = req.params
    try {
      const meta = await metaRepo.findOneOrFail({
        relations: ["columns"],
        where: {
          id: id
        }
      })
      res.render("metas/apis/new.pug", {
        current_user: req.user,
        meta: meta
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static postNewApi = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const columnRepo = getRepository(MetaColumn);
    const apiRepo = getRepository(Api);
    const apiColumnRepo = getRepository(ApiColumn);

    const { id } = req.params;
    const { apiName, entityName, needId } = req.body;
    
    //validate inputs
    let message: string;
    if(apiName == undefined || apiName.length == 0) message = 'API 명을 입력해주세요.'
    if(entityName == undefined || entityName.length == 0) message = 'entity 명을 입력해주세요.'
    if(message) {
      req.flash('danger', message);
      res.redirect(`/metas/${id}/new`);
    }

    let tableForDelete;
    try {
      // meta data load
      const meta = await metaRepo.findOneOrFail({
        relations: ["api"],
        where: {
          id: id
        }
      })

      const metaColumns = await columnRepo.find({
        where: {
          meta: {
            id: id
          }
        },
        order: {
          order: 'ASC'
        }
      });

      if(meta.api || meta.isActive) {
        req.flash('danger', '이미 배포된 api가 있습니다.');
        res.redirect(`/metas/${meta.id}`);
        return;
      }

      let api = new Api(apiName, entityName, meta, <User>req.user);

      // column data 생성
      let columns = []
      let columnNames = []
      let apiColumns: ApiColumn[] = []

      if(needId) {
        // autoincrease 설정
        columns.push({
          name: "id",
          type: "int",
          isPrimary: true,
          isGenerated: true,
          generationStrategy: "increment"
        })
      }
      

      metaColumns.forEach(column => {
        columnNames.push(column.columnName)
        columns.push({
          name: column.columnName,
          type: column.type,
          isNullable: true
        })
        apiColumns.push(new ApiColumn(column.columnName, column.type, api));
      });

      //table data 생성
      //table Name convention 필요
      const tableOption: TableOptions = {
        name: api.tableName,
        columns: columns
      }
      
      let insertQuery = `INSERT INTO ${tableOption.name}(${columnNames.join(",")}) VALUES ?`

      /**
       * TODO: getRows 와 같이 범용적인 함수를 만들고, 함수 내부에서 data type을 확인 후 RDBMS, CSV 등을 읽어오도록 구현
       */
      let insertValues = await RowGenerator.generateRows(meta, columnNames);
      
      tableForDelete = tableOption.name;
      api.columnLength = apiColumns.length;
      api.dataCounts = insertValues.length;

      /**
       * TODO: 2개의 DB에 작업을 하기 때문에 Transaction과 관련된 추가적인 예외 처리가 필요함
       */
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await getConnection('dataset').createQueryRunner().createTable(new Table(tableOption));
        await getConnection('dataset').manager.query(insertQuery, [insertValues])
        meta.isActive = true;
        await metaRepo.save(meta);
        await apiRepo.save(api);
        await apiColumnRepo.save(apiColumns);
      });

      // kong service 생성 TEST 코드
      // let kongService: KongService = new KongService("testname", "localhost", 3000, "/apiPath");
      // await KongClient.addService(kongService);
      
      res.redirect(`/metas/${meta.id}`)
    } catch (err) {
      console.error(err);
      await getConnection('dataset').createQueryRunner().dropTable(tableForDelete, true);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default MetaController;