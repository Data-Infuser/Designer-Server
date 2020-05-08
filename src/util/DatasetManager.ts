import { getManager } from "typeorm";

export class DatasetManager {
  static getDatasetByName = async (tableName:string, selectColumns: string = "*") => {
    const dataset = await getManager('dataset')
    .query(`SELECT ${selectColumns} FROM ${tableName}`)
  
    return JSON.stringify(dataset)
  }
}