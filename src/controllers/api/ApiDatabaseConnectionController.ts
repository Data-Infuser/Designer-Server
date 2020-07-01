import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import ApplicationError from "../../ApplicationError";
import { DatabaseConnection, AcceptableDbms } from "../../entity/manager/DatabaseConnection";
import { User } from "../../entity/manager/User";
import { MysqlHelper } from "../../helpers/MysqlHelper";
import { needAuth } from "../../middlewares/checkAuth";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Delete } from "tsoa";
import { reject } from "lodash";
import { resolve } from "url";
import { Request as exRequest } from "express";
import { connect } from "http2";

@Route("/api/database-connections")
@Tags("Database Connection")
export class ApiDatabaseConnectionController {

  @Get("/")
  @Security("jwt")
  public async get(
    @Request() request: exRequest
  ){
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
    try {
      const dbcs = await dbcRepo.find({
        where: {
          user: {
            id: request.user.id
          }
        }
      });
      resolve(dbcs);
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
        const connectOption:ConnectionOptions = {
          name: "mysqlTempConnection",
          type: "mysql",
          host: dbc.hostname,
          port: Number(dbc.port),
          username: dbc.username,
          password: dbc.password,
          database: dbc.database
        }
        const tables = await MysqlHelper.showTables(connectOption);
        const tableStatuses = await MysqlHelper.showTableStatus(connectOption);
        resolve({
          tables: tables,
          tableStatuses: tableStatuses
        })
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

        const dbcs = await dbcRepo.find({
          where: {
            user: {
              id: request.user.id
            }
          }
        })
        
        resolve({
          message: "delete success",
          connectionId : connectionId,
          dbcs: dbcs
        })
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