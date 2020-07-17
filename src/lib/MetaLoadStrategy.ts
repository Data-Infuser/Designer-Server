import MetaLoaderDbConnection from "./interfaces/MetaLoaderDbConnection";

export default interface MetaLoadStrategy {
  loadMeta(info:MetaLoaderDbConnection);
}