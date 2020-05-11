import { getManager } from "typeorm";
import { SelectOptions } from "./SelectOptions";

export class DatasetManager {
  static getDatasetByName = async (tableName:string, selectOptions: SelectOptions) => {
    const dataset = await getManager('dataset')
    .query(
      `SELECT ${selectOptions.fields} 
      FROM ${tableName}
      limit ${(selectOptions.page-1)*selectOptions.perPage},${selectOptions.perPage}`
      )
  
    return dataset
  }
}