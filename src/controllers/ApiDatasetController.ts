import { Request, Response, NextFunction } from "express";
import { getConnection, LessThanOrEqual, getRepository, getManager } from "typeorm";
import { Meta } from "../entity/Meta";
import ApplicationError from "../ApplicationError";


class ApiDatasetController {

  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const identifier = req.params.identifier

    try {
      console.log('api dataset show called');

      let dataset = await ApiDatasetController.getDatasetByName(identifier)
      if (!dataset) {
        const meta = await metaRepo.findOne(identifier)
        if (!meta) console.log('no matching meta found')

        dataset = await ApiDatasetController.getDatasetByName(meta.title)
      }

      res.end(dataset)
    } catch (err) {
      console.error(err);
      next(new ApplicationError(500, err.message));
      return;
    }
  }

  static getDatasetByName = async(name) => {
    const dataset = await getManager()
    .query(`SELECT * FROM ${name}`)

    return JSON.stringify(dataset)
  }
}

export default ApiDatasetController;