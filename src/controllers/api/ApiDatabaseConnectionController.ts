import { getRepository, getConnection, getManager, ConnectionOptions } from "typeorm";
import ApplicationError from "../../ApplicationError";
import { DatabaseConnection } from "../../entity/manager/DatabaseConnection";
import { User } from "../../entity/manager/User";
import { MysqlHelper } from "../../helpers/MysqlHelper";
import { needAuth } from "../../middlewares/checkAuth";
import { Route, Get, Tags, Security } from "tsoa";

@Route("/api/database-connections")
@Tags("Database Connection")
export class ApiDatabaseConnectionController {

  @Get("/")
  @Security("jwt")
  public async get(
  ){
    return new Promise(async function(resolve, reject) {
      const dbcRepo = getRepository(DatabaseConnection);
    try {
      const dbcs = await dbcRepo.find();
      resolve(dbcs);
    } catch (err) {
      reject(err);
    }
    });
  }
  
}

