import DataLoaderTableColumnsParams from "../interfaces/dataloader/DataLoaderTableColumnsParams";
import axios from "axios";

const property = require("../../property.json");

export default class DataLoaderHelper {
  static getTableColumns(dataLoaderDbmsParams: DataLoaderTableColumnsParams):Promise<any> {
    return new Promise(async function(resolve, reject) {
      const apiUrl = `${property.dataLoaderUrl}/db-info/tables/${dataLoaderDbmsParams.tableNm}/columns`
      try {
        const response = await axios(apiUrl, {params: dataLoaderDbmsParams});
        resolve(response.data);
      } catch (err) {
        reject(err);
      }
    })
  }
}