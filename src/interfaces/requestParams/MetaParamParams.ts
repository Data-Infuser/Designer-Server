import { ParamOperatorType } from "../../entity/manager/MetaParam";

export interface MetaParamParams {
  id?: number,
  metaColumnId?: number,
  operator?: ParamOperatorType,
  description?: string,
  isRequired?: boolean
}