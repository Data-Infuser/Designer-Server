import express from 'express';
import bullBoard from 'bull-board';
import Bull from 'bull';
import { Stage } from '../entity/manager/Stage';
import property from "../config/propertyConfig";

class BullManager {
  private static _instance: BullManager;

  dataLoaderQueue: Bull.Queue;
  metaLoaderQueue: Bull.Queue;
  downloadQueue: Bull.Queue;

  crawlerQueue: Bull.Queue;

  public static setupBull(server: express.Application) {
    BullManager._instance = new BullManager();
    const redisInfo = {
      redis: {
        port: property.jobqueueRedis.port,
        host: property.jobqueueRedis.host
      }
    }
    if(process.env.NODE_ENV !== "production") {
      redisInfo.redis.host = "localhost"
    }
    BullManager._instance.dataLoaderQueue = new Bull('dataLoader', redisInfo);
    BullManager._instance.metaLoaderQueue = new Bull('metaLoader', redisInfo);
    BullManager._instance.crawlerQueue = new Bull('crawler', redisInfo);
    BullManager._instance.downloadQueue = new Bull('download', redisInfo);

    bullBoard.setQueues([BullManager._instance.dataLoaderQueue, BullManager._instance.crawlerQueue, BullManager._instance.metaLoaderQueue, BullManager._instance.downloadQueue])
    server.use('/bulls', bullBoard.UI)
  }

  public static get Instance() {
    return this._instance;
  }

  setDataLoaderSchedule = async(stage: Stage):Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        const job = await this.dataLoaderQueue.add({
          id: stage.id,
          userId: stage.application.userId
        })
        resolve();
      } catch (err) {
        reject(err);
      }
    }) 
  }

  setMetaLoaderSchedule = async(metaId: number): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        await this.metaLoaderQueue.add({
          metaId
        })
        resolve();
      } catch (err) {
        reject(err);
      }
    }) 
  }

  setDownloadSchedule = async(metaId: number, url: string, fileName: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        await this.downloadQueue.add({
          metaId,
          url,
          fileName
        })
        resolve();
      } catch (err) {
        reject(err);
      }
    }) 
  }

}

export default BullManager;