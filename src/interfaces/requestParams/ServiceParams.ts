import FileParams from "./FileParams";
import DbmsParams from "./DbmsParams";

/**
 * metaId는 post /services 에서 사용
 */
export default interface ServiceParams {
  metaId?: number,
  method: string,
  entityName: string,
  description: string
}