import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import passport from "passport";
import { User } from "../../entity/manager/User";
import { Tags, Route, Post, Security, Request, Body, Delete, Path } from "tsoa";
import { Service, ServiceStatus } from '../../entity/manager/Service';
import ApplicationError from "../../ApplicationError";
import { Application } from "../../entity/manager/Application";
import { Meta } from '../../entity/manager/Meta';
import DataLoaderHelper from '../../helpers/DataLoaderHelper';
import mysqlTypes from "../../util/dbms_data_types/mysql.json";
import { MetaColumn } from "../../entity/manager/MetaColumn";
import { convertType } from "../../util/MetaLoader";
import multer from "multer";
import property from "../../../property.json";
import * as Excel from 'exceljs';

@Route("/api/metas")
@Tags("Meta")
export class ApiMetaController {

  @Post("/dbms")
  @Security("jwt")
  public async postDbms(
    @Request() request: exRequest,
    @Body() dbmsParams: postDbmsParams
  ): Promise<Meta> {
    return new Promise(async function(resolve, reject) {
      const metaRepo = getRepository(Meta);
      const serviceRepo = getRepository(Service);
      const metaColumnRepo = getRepository(MetaColumn);
      const { serviceId, title, dbms, host, port, database, user, password, table } = dbmsParams;
      if(title.length == 0 
        || dbms.length == 0 
        || host.length == 0 
        || port.length == 0 
        || database.length == 0 
        || user.length == 0 
        || table.length == 0) {
        reject(new ApplicationError(400, "Need all params"));
      }
      try {
        const service = await serviceRepo.findOneOrFail(serviceId);
        const getParams = {
          dbms: dbms,
          username: user,
          password: password,
          hostname: host,
          port: port,
          database: database,
          tableNm: table
        }
        const columnsResponse = await DataLoaderHelper.getTableColumns(getParams)
        console.log(columnsResponse);

        const meta = new Meta();
        meta.title = title;
        meta.dataType = 'dbms';
        meta.host = host;
        meta.port = port;
        meta.db = database;
        meta.dbUser = user;
        meta.pwd = password;
        meta.table = table;
        meta.service = service;
        meta.user = request.user;

        let columns = []
        for(let i = 0; i < columnsResponse.length; i++) {
          console.log(i);
          const info = columnsResponse[i]
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = info.name;
          metaCol.columnName = info.name;
          const convertedType = convertType(info.type);
          metaCol.type = convertedType.type;
          if(convertedType.size) metaCol.size = convertedType.size;
          metaCol.meta = meta;
          metaCol.order = i;
          columns.push(metaCol);
        }
        let updatedMeta;
        await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
          updatedMeta = await metaRepo.save(meta);
          await metaColumnRepo.save(columns);
          service.status = ServiceStatus.METALOADED;
          await serviceRepo.save(service);
        });
        updatedMeta = await metaRepo.findOneOrFail({
          relations: ["service", "columns"],
          where: {
            id: updatedMeta.id
          }
        });
        resolve(updatedMeta);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
        return;
      }
    });
  }

  /**
   * File upload의 경우 api doc 생성을 위해서는 tsoa.json에 param 설정을 해야함.
   *  body param 정보는 tsoa.json을 참고해주세요.
   * @param request 
   */
  @Post("/file")
  @Security("jwt")
  public async postFile(
    @Request() request: exRequest
  ): Promise<any> {
    const serviceRepo = getRepository(Service);
    const metaRepo = getRepository(Meta);
    const metaColumnRepo = getRepository(MetaColumn);

    await this.handleFile(request);
    return new Promise(async function(resolve, reject) {
      try {
        const { title, skip, sheet, serviceId } = request.body;
        const service = await serviceRepo.findOneOrFail(serviceId);

        const filePath = request.file.path;
        const originalFileName:string = request.file.originalname;
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

        meta.service = service;
        let updatedMeta
        await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
          updatedMeta = await metaRepo.save(meta);
          await metaColumnRepo.save(columns);
          service.status = ServiceStatus.METALOADED;
          await serviceRepo.save(service);
        });

        updatedMeta = await metaRepo.findOneOrFail({
          relations: ["service", "columns"],
          where: {
            id: updatedMeta.id
          }
        });
        resolve(updatedMeta);
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  private handleFile(request: exRequest): Promise<any> {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, property["upload-dist"].localPath)
      },
      filename: function (req, file, cb) {
        const originalFileName:string = file.originalname;
        const originalFileNameTokens = originalFileName.split(".");
        const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
        cb(null, req.user.id + "-" + Date.now() + "." + ext)
      }
    })
    const multerSingle = multer({ storage }).single("file");
    return new Promise((resolve, reject) => {
      multerSingle(request, undefined, async (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }
}

interface postDbmsParams {
  serviceId: number,
  title: string,
  dbms: string,
  host: string,
  port: string,
  database: string,
  user: string,
  password:string,
  table: string
}