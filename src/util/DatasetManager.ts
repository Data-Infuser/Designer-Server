import { getManager } from "typeorm";

export class DatasetManager {
  static getDatasetByName = async (name) => {
    const dataset = await getManager('dataset')
    .query(`SELECT * FROM ${name}`)
  
    return JSON.stringify(dataset)
  }
}