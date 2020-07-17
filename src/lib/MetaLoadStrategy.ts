import MetaLoaderDbConnection from "./interfaces/MetaLoaderDbConnection";
import MetaLoaderFileParam from "./interfaces/MetaLoaderFileParam";

export default interface MetaLoadStrategy {
  loadMeta(info:MetaLoaderDbConnection|MetaLoaderFileParam);
}