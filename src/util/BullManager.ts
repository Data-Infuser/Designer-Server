import express from 'express';
import bullBoard from 'bull-board';
import Queue from 'bull';
import { Application, ApplicationStatus } from '../entity/manager/Application';
const property = require("../../property.json");

class BullManager {
  private static _instance: BullManager;

  dataLoaderQueue:Queue.Queue;

  public static setupBull(server: express.Application) {
    BullManager._instance = new BullManager();
    BullManager._instance.dataLoaderQueue = new Queue('dataLoader', {
      redis: {
        port: property["jobqueue-redis"].port,
        host: property["jobqueue-redis"].host
      }
    });
    bullBoard.setQueues([BullManager._instance.dataLoaderQueue])
    server.use('/bulls', bullBoard.UI)
  }

  public static get Instance() {
    return this._instance;
  }

  setSchedule = async (application: Application):Promise<Application> => {
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
}

export default BullManager;