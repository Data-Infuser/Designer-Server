import DataLoaderTableColumnsParams from "../interfaces/dataloader/DataLoaderTableColumnsParams";
import axios from "axios";
import property from "../../property.json";

export default class DataLoaderHelper {
  static getTableColumns(dataLoaderDbmsParams: DataLoaderTableColumnsParams):Promise<any> {
    return new Promise(async function(resolve, reject) {
      const apiUrl = `${property.dataLoaderUrl}/db-info/tables/${dataLoaderDbmsParams.tableNm}/columns`
      try {
        const response = await axios(apiUrl, {params: dataLoaderDbmsParams});
        console.log(response);
        resolve(response.data);
      } catch (err) {
        reject(err);
      }
    })
  }
}