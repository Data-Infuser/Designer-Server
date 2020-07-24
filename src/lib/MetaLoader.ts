import { Application } from "../entity/manager/Application";
import { Service } from "../entity/manager/Service";
import MetaLoaderDbConnection from "./interfaces/MetaLoaderDbConnection";
import MetaLoaderFileParam from "./interfaces/MetaLoaderFileParam";
import DescTableResult from "./interfaces/DescTableResult";

class MetaLoader {
  private metaLoadStrategy;

  constructor(metaLoadStrategy) {
    this.metaLoadStrategy = metaLoadStrategy;
  }

  public async loadMeta(info:MetaLoaderDbConnection|MetaLoaderFileParam):Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.metaLoadStrategy.loadMeta(info));
      } catch (err) {
        console.error(err);
        reject(err);
      }
    })
  }

  public async showTables(info:MetaLoaderDbConnection):Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.metaLoadStrategy.showTables(info));
      } catch (err) {
        console.error(err);
        reject(err);
      }
    })
  }

  public async descTable(info:MetaLoaderDbConnection):Promise<DescTableResult[]> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.metaLoadStrategy.descTable(info));
      } catch (err) {
        console.error(err);
        reject(err);
      }
    })
  }

}

export default MetaLoader;