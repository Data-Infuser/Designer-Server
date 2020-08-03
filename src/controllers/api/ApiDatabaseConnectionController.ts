import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import ApplicationError from "../../ApplicationError";
import { DatabaseConnection, AcceptableDbms } from "../../entity/manager/DatabaseConnection";
import { User } from "../../entity/manager/User";
import { MysqlHelper } from "../../helpers/MysqlHelper";
import { needAuth } from "../../middlewares/checkAuth";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Delete, Query } from "tsoa";
import { reject } from "lodash";
import { resolve } from "url";
import { Request as exRequest } from "express";
import { connect } from "http2";
import MetaLoadStrategy from "../../lib/MetaLoadStrategy";
import MysqlMetaLoadStrategy from "../../lib/strategies/MysqlMetaLoadStrategy";
import CubridMetaLoadStrategy from "../../lib/strategies/CubridMetaLoadStrategy";
import MetaLoader from "../../lib/MetaLoader";
import MetaLoaderDbConnection from "../../lib/interfaces/MetaLoaderDbConnection";
import DbmsMetaLoadStrategy from "../../lib/strategies/DbmsMetaLoadStrategy";

@Route("/api/database-connections")
@Tags("Database Connection")
export class ApiDatabaseConnectionController {

  @Get("/")
  @Security("jwt")
  public async get(
    @Request() request: exRequest,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ){
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
      page = page || 1;
      perPage = perPage || 10;
      try {
        const dbcs = await dbcRepo.findAndCount({
          where: {
            user: {
              id: request.user.id
            }
          },
          skip: (page - 1) * perPage,
          take: perPage
        });
        resolve({
          dbcs: dbcs[0],
          totalCount: dbcs[1],
          page: page,
          perPage: perPage
        });
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }
  
  /**
   * DB에 접속하여 Table 목록을 불러옵니다.
   * @param connectionId 
   */
  @Get("/{connectionId}")
  @Security("jwt")
  public async getTablesInConnection(
    @Request() request: exRequest,
    @Path() connectionId: number
  ){
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
      try {
        const dbc = await dbcRepo.findOneOrFail({
          where: {
            id: connectionId,
            user: {
              id: request.user.id
            }
          }
        });
        resolve(dbc);
      } catch(err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  /**
   * Database Connection의 상세 정보를 보여줍니다.
   * @param connectionId Database Connection의 id
   */
  @Get("/{connectionId}/tables")
  @Security("jwt")
  public async getConnection(
    @Request() request: exRequest,
    @Path() connectionId: number
  ){
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
      try {
        const dbc = await dbcRepo.findOneOrFail(connectionId);

        let loadStrategy: DbmsMetaLoadStrategy;
        switch(dbc.dbms) {
          case 'mysql':
            loadStrategy = new MysqlMetaLoadStrategy();
            break;
          case 'cubrid':
            loadStrategy = new CubridMetaLoadStrategy();
            break;
          default:
            throw new Error("unexceptable dbms");
        }
        const metaLoader = new MetaLoader(loadStrategy);
        const connectionInfo:MetaLoaderDbConnection = {
          ...dbc,
          title: dbc.connectionName,
          tableNm: ""
        }
        const loaderResult = await metaLoader.showTables(connectionInfo);
        resolve(loaderResult)
      } catch(err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }



  /**
   * DB에 접속하여 Table의 컬럼 목록과 정보를 가져옵니다.
   * @param connectionId 
   * @param tableName 정보를 가져오려는 테이블 명
   */
  @Get("/{connectionId}/tables/{tableName}")
  @Security("jwt")
  public async getTable(
    @Request() request: exRequest,
    @Path() connectionId: number,
    @Path() tableName: string
  ){
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
      try {
        const dbc = await dbcRepo.findOneOrFail(connectionId);

        let loadStrategy: DbmsMetaLoadStrategy;
        switch(dbc.dbms) {
          case 'mysql':
            loadStrategy = new MysqlMetaLoadStrategy();
            break;
          case 'cubrid':
            loadStrategy = new CubridMetaLoadStrategy();
            break;
          default:
            throw new Error("unexceptable dbms");
        }
        const metaLoader = new MetaLoader(loadStrategy);
        const connectionInfo:MetaLoaderDbConnection = {
          ...dbc,
          title: dbc.connectionName,
          tableNm: tableName
        }

        const loaderResult = await metaLoader.descTable(connectionInfo);
        resolve(loaderResult);
      } catch(err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  @Post("/")
  @Security("jwt")
  public async post(
    @Request() request: exRequest,
    @Body() databaseConnectionCreateParams: DatabaseConnectionCreateParams
  ): Promise<DatabaseConnection>{
    return new Promise(async function(resolve, reject){
      const dbcRepo = getRepository(DatabaseConnection);
      const { title, host, port, db, user, pwd, dbms } = databaseConnectionCreateParams;

      try {
        const newConnection = new DatabaseConnection();
        newConnection.connectionName = title;
        newConnection.hostname = host;
        newConnection.port = port;
        newConnection.database = db;
        newConnection.username = user;
        newConnection.password = pwd ? pwd : "";
        newConnection.dbms = dbms;
        newConnection.user = request.user;
        await dbcRepo.save(newConnection);
        resolve(newConnection);
      } catch(err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    })
  }

  @Delete("/{connectionId}")
  @Security("jwt")
  public async delete(
    @Request() request: exRequest,
    @Path() connectionId: number
  ): Promise<any> {
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
      try {
        
        await dbcRepo.delete(connectionId);

        resolve();
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
        return;
      }
    });
  }
}

interface DatabaseConnectionCreateParams { 
  title: string, 
  host: string, 
  port: string,
  db: string,
  user: string,
  pwd: string,
  dbms: AcceptableDbms 
}