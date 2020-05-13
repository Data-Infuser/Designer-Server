import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";

export interface MetaInfo {
    meta: Meta;
    columns: MetaColumn[];
}
