import {MigrationInterface, QueryRunner, getConnection} from "typeorm";
import { User } from "../entity/manager/User";

export class InsertDefaultUser1588135759196 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    return new Promise(async function(resolve, reject) {
      const userReposiroty = getConnection().getRepository(User);

      let defaultUser = new User();
      defaultUser.username = "admin";
      defaultUser.password = "admin";
      defaultUser.hashPassword();
      try {
        await userReposiroty.save(defaultUser);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
  }

}
