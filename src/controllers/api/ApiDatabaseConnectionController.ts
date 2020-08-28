import { getRepository, FindManyOptions, FindOneOptions } from "typeorm";
import ApplicationError from "../../ApplicationError";
import { DatabaseConnection, AcceptableDbms } from "../../entity/manager/DatabaseConnection";
import { Route, Get, Tags, Security, Path, Request, Post, Body, Delete, Query } from "tsoa";
import { Request as exRequest } from "express";
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
    const dbcRepo = getRepository(DatabaseConnection);
    page = page || 1;
    perPage = perPage || 10;

    const findOptions:FindManyOptions = {
      where: {
        userId: request.user.id
      },
      skip: (page - 1) * perPage,
      take: perPage
    }
    const dbcs = await dbcRepo.findAndCount(findOptions);

    return Promise.resolve({
      dbcs: dbcs[0],
      totalCount: dbcs[1],
      page: page,
      perPage: perPage
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
    const dbcRepo = getRepository(DatabaseConnection);
    const findOptions: FindOneOptions = {
      where: {
        id: connectionId,
        userId: request.user.id
      }
    }
    const dbc = await dbcRepo.findOneOrFail(findOptions);
    return Promise.resolve(dbc);
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
    const dbcRepo = getRepository(DatabaseConnection);

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

    return Promise.resolve(loaderResult)
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
    const dbcRepo = getRepository(DatabaseConnection);

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

    return Promise.resolve(loaderResult);
  }

  @Post("/")
  @Security("jwt")
  public async post(
    @Request() request: exRequest,
    @Body() databaseConnectionCreateParams: DatabaseConnectionCreateParams
  ): Promise<DatabaseConnection>{
    const dbcRepo = getRepository(DatabaseConnection);
    const { title, host, port, db, user, pwd, dbms } = databaseConnectionCreateParams;
    
    const newConnection = new DatabaseConnection();
    newConnection.connectionName = title;
    newConnection.hostname = host;
    newConnection.port = port;
    newConnection.database = db;
    newConnection.username = user;
    newConnection.password = pwd ? pwd : "";
    newConnection.dbms = dbms;
    newConnection.userId = request.user.id;
    await dbcRepo.save(newConnection);

    return Promise.resolve(newConnection);
  }

  @Delete("/{connectionId}")
  @Security("jwt")
  public async delete(
    @Path() connectionId: number
  ): Promise<any> {
    const dbcRepo = getRepository(DatabaseConnection);        
    await dbcRepo.delete(connectionId);
    return Promise.resolve();
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