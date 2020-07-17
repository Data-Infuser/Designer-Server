import { Application } from "../entity/manager/Application";
import { Service } from "../entity/manager/Service";

class MetaLoader {
  private metaLoadStrategy;

  constructor(metaLoadStrategy) {
    this.metaLoadStrategy = metaLoadStrategy;
  }

  public async loadMeta(info):Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.metaLoadStrategy.loadMeta(info));
      } catch (err) {
        console.error(err);
        reject(err);
      }
    })
    
  }
}

export default MetaLoader;