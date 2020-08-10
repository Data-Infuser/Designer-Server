import express from 'express';
import bullBoard from 'bull-board';
import Bull from 'bull';
import { Application, ApplicationStatus } from '../entity/manager/Application';

const property = require("../../property.json");

class BullManager {
  private static _instance: BullManager;

  dataLoaderQueue: Bull.Queue;
  metaLoaderQueue: Bull.Queue;

  public static setupBull(server: express.Application) {
    BullManager._instance = new BullManager();
    const redisInfo = {
      redis: {
        port: property["jobqueue-redis"].port,
        host: property["jobqueue-redis"].host
      }
    }
    BullManager._instance.dataLoaderQueue = new Bull('dataLoader', redisInfo);
    BullManager._instance.metaLoaderQueue = new Bull('metaLoader', redisInfo);

    bullBoard.setQueues([BullManager._instance.dataLoaderQueue])
    bullBoard.setQueues([BullManager._instance.metaLoaderQueue])
    server.use('/bulls', bullBoard.UI)
  }

  public static get Instance() {
    return this._instance;
  }

  setDataLoaderSchedule = async(application: Application):Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        await this.dataLoaderQueue.add({
          id: application.id,
          userId: application.user.id
        })
        resolve();
      } catch (err) {
        reject(err);
      }
    }) 
  }

  setMetaLoaderSchedule = async(serviceId: number, url: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        await this.dataLoaderQueue.add({
          serviceId,
          url
        })
        resolve();
      } catch (err) {
        reject(err);
      }
    }) 
  }
}

export default BullManager;