import FileParams from "./FileParams";
import DbmsParams from "./DbmsParams";

export default interface ServiceParams {
  metaId: number,
  method: string,
  entityName: string,
  description: string,
  fileParams?: FileParams,
  dbmsParams?: DbmsParams
}