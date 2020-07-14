import express from 'express';
import bullBoard from 'bull-board';
import Queue from 'bull';
import setupBull from './BullManager';
import Bull from 'bull';

class BullManager {
  private static _instance: BullManager;

  dataLoaderQueue:Queue.Queue;

  public static setupBull(server: express.Application) {
    BullManager._instance = new BullManager();
    BullManager._instance.dataLoaderQueue = new Queue('dataLoader');
    bullBoard.setQueues([BullManager._instance.dataLoaderQueue])
    server.use('/bulls', bullBoard.UI)
  }

  public static getInstance() {
    return this._instance;
  }
}

export default BullManager;