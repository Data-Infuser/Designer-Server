import { Request, Response, NextFunction } from "express";
import { getRepository } from "typeorm";
import { Meta } from "../entity/Meta";
import {DatasetManager} from "../util/DatasetManager";

class ApiDatasetController {

  static getShow = async(req: Request, res: Response, next: NextFunction) => {
    const metaRepo = getRepository(Meta);
    const identifier = req.params.identifier

    try {
      console.log('api dataset show called');

      let dataset = await DatasetManager.getDatasetByName(identifier)
      if (!dataset) {
        const meta = await metaRepo.findOne(identifier)
        if (!meta) console.log('no matching meta found')

        dataset = await DatasetManager.getDatasetByName(meta.title)
      }

      res.end(dataset)
    } catch (err) {
      console.error(err);
    }
  }
}

export default ApiDatasetController;