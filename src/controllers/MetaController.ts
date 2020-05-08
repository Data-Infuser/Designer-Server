import { Request, Response, NextFunction } from "express";
import * as multiparty from 'multiparty';
import * as Excel from 'exceljs';
import { getConnection, LessThanOrEqual, getRepository, getManager, TableColumn, Table, Column } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";
import { User } from "../entity/manager/User";
import { TableOptions } from "typeorm/schema-builder/options/TableOptions";
import { Api } from "../entity/manager/Api";
import ApplicationError from "../ApplicationError";


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
    try {
      const formData = await promisifyUpload(req);

      let files = formData.files;
      let { title, skip, sheet } = formData.fields;

      if(files == undefined) {
        req.flash('danger', '파일이 없습니다.');
        res.redirect('/metas/new');
        return;
      }

      if(title == undefined || title.length == 0) {
        req.flash('danger', 'Meta명이 없습니다.');
        res.redirect('/metas/new');
        return;
      }

      const filePath = files['upload'][0].path;
      const originalFileName:string = files['upload'][0].originalFilename;
      const originalFileNameTokens = originalFileName.split(".");
      const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
      const loadedWorkbook = await new Excel.Workbook().xlsx.readFile(filePath);
      const worksheet = loadedWorkbook.worksheets[sheet]
      const totalRowCount = worksheet.rowCount

      const header = worksheet.getRow(skip + 1).values;

      const meta = new Meta();
      meta.title = title;
      meta.originalFileName = originalFileName;
      meta.filePath = filePath;
      meta.rowCounts = totalRowCount - 1;
      meta.extension = ext;
      meta.skip = skip;
      meta.sheet = sheet;
      meta.user = <User>req.user;
      
      let columns = []
      for(let i = 1; i < header.length; i++) {
        const col = header[i];
        const metaCol = new MetaColumn();
        metaCol.originalColumnName = col;
        metaCol.columnName = col;
        metaCol.meta = meta;
        metaCol.order = i;
        columns.push(metaCol);
      }

      
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(meta);
        await metaColRepo.save(columns);
      })
      res.redirect(`/metas/${meta.id}`);
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
  
  static getIndex = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);

    try {
      const apis = await metaRepo.find();

      res.render("metas/index.pug", {
        apis: apis,
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
      res.render("metas/api/new.pug", {
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

    const { id } = req.params;
    const { tableName } = req.body;

    let tableForDelete;
    if(tableName == undefined || tableName.length == 0) {
      req.flash('danger', 'API 명을 입력해주세요.');
      res.redirect(`/metas/${id}/new`);
      return;
    }
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

      // column data 생성
      let columns = []
      let columnNames = []
      // autoincrease 설정
      columns.push({
        name: "id",
        type: "int",
        isPrimary: true,
        isGenerated: true,
        generationStrategy: "increment"
      })

      metaColumns.forEach(column => {
        columnNames.push(column.columnName)
        columns.push({
          name: column.columnName,
          type: column.type,
          isNullable: true
        })
      });

      //table data 생성
      //table Name convention 필요

      let api = new Api(tableName, meta, <User>req.user);
      const tableOption: TableOptions = {
        name: api.tableName,
        columns: columns
      }
      
      let insertQuery = `INSERT INTO ${tableOption.name}(${columnNames.join(",")}) VALUES ?`
      console.log(insertQuery);
      let insertValues = []
      //xlsx read
      const loadedWorkbook = await new Excel.Workbook().xlsx.readFile(meta.filePath);
      const worksheet = loadedWorkbook.worksheets[meta.sheet]
      const totalRowCount = worksheet.rowCount
      for(let i = meta.skip + 2; i <= totalRowCount; i++) {
        let row = <string[]>worksheet.getRow(i).values
        if(row.length == 0) continue;
        insertValues.push(row.slice(1));
      }

      tableForDelete = tableOption.name;
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await getConnection('dataset').createQueryRunner().createTable(new Table(tableOption));
        await getConnection('dataset').manager.query(insertQuery, [insertValues])
        meta.isActive = true;
        await metaRepo.save(meta);
        await apiRepo.save(api);
      });
      
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