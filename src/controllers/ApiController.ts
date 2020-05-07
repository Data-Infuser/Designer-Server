import { Request, Response, NextFunction } from "express";
import * as multiparty from 'multiparty';
import * as Excel from 'exceljs';
import { getConnection, LessThanOrEqual, getRepository, getManager } from "typeorm";
import { Meta } from "../entity/Meta";
import { MetaColumn } from "../entity/MetaColumn";
import { User } from "../entity/User";


class ApiController {

  static uploadXlsxFile = async(req: Request, res: Response) => {
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
      let { title } = formData.fields;

      const filePath = files['upload'][0].path;
      const originalFileName:string = files['upload'][0].originalFilename;
      const originalFileNameTokens = originalFileName.split(".");
      const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
      const loadedWorkbook = await new Excel.Workbook().xlsx.readFile(filePath);
      const worksheet = loadedWorkbook.worksheets[1]
      const totalRowCount = worksheet.rowCount

      const header = worksheet.getRow(1).values;

      const meta = new Meta()
      meta.title = title
      meta.originalFileName = originalFileName;
      meta.filePath = filePath;
      meta.rowCounts = totalRowCount - 1;
      meta.extension = ext
      meta.user = <User>req.user;
      
      let columns = []
      for(let i = 1; i < header.length; i++) {
        const col = header[i];
        const metaCol = new MetaColumn()
        metaCol.originalColumnName = col
        metaCol.columnName = col
        metaCol.meta = meta
        columns.push(metaCol);
      }

      
      await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
        await metaRepo.save(meta);
        await metaColRepo.save(columns);
      })
      res.redirect(`/apis/${meta.id}`);
    } catch (err) {
      console.error(err);
    }
  }
  
  static getIndex = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);

    try {
      const apis = await metaRepo.find();

      res.render("apis/index.pug", {
        apis: apis,
        current_user: req.user
      })
    } catch (err) {
      console.error(err);
    }
  }

  static getNew = async(req: Request, res: Response, next: NextFunction) => {
    res.render("apis/new.pug", {
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
      res.render("apis/show.pug", {
        current_user: req.user,
        meta: meta
      })
    } catch (err) {
      console.error(err);
    }
    
  }
}

export default ApiController;