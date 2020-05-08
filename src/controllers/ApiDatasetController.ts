import { Request, Response, NextFunction } from "express";
import { getRepository } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import ApplicationError from "../ApplicationError";
import {DatasetManager} from "../util/DatasetManager";
import { Api } from "../entity/manager/Api";

class ApiDatasetController {

  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const apiRepo = getRepository(Api);
    const identifier = req.params.identifier

    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["columns"],
        where: {
          tableName: identifier
        }
      });

      let columns:string[] = []
      api.columns.forEach(col => {
        if(!col.hidden) columns.push(`\`${col.columnName}\``)
      });

      const selectedColumns = columns.length == 0 ? '*' : columns.join(',')
      let dataset = await DatasetManager.getDatasetByName(identifier, selectedColumns)

      res.end(dataset)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiDatasetController;