import { Request, Response, NextFunction } from "express";
import { getRepository } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import ApplicationError from "../ApplicationError";
import {DatasetManager} from "../util/DatasetManager";
import { Api } from "../entity/manager/Api";
import { SelectOptions } from "../interfaces/SelectOptions";

const DEFAULT_PER_PAGE = 500;
class ApiDatasetController {
  
  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const apiRepo = getRepository(Api);
    const identifier = req.params.identifier;
    let page: number = Number(req.query.page);
    let perPage: number = Number(req.query.perPage);
    
    try {
      const api = await apiRepo.findOneOrFail({
        relations: ["columns"],
        where: {
          tableName: identifier
        }
      });

      //Fields
      let columns:string[] = []
      api.columns.forEach(col => {
        if(!col.hidden) columns.push(`\`${col.columnName}\``)
      });
      const selectedColumns = columns.length == 0 ? '*' : columns.join(',')

      //page
      if(!page || page < 1) page = 1;
      if(!perPage || perPage < 1) perPage = DEFAULT_PER_PAGE;

      const selectOption:SelectOptions = {
        fields: selectedColumns,
        page: page,
        perPage: perPage
      }

      //pagenation
      let result = await DatasetManager.getDatasetByName(identifier, selectOption)

      res.json({
        page: page,
        perPage: perPage,
        totalCount: api.dataCounts,
        currentCount: result.length,
        datas: result
      })
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }
}

export default ApiDatasetController;