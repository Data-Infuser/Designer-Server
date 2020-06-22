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