import express from 'express';
import bullBoard from 'bull-board';
import Bull from 'bull';
import { Application } from '../entity/manager/Application';
import { getRepository, getManager } from 'typeorm';
import { Service } from '../entity/manager/Service';
import MetaLoaderFileParam from '../lib/interfaces/MetaLoaderFileParam';
import { ApiMetaController } from '../controllers/api/ApiMetaController';
import { Stage } from '../entity/manager/Stage';
import { Meta, MetaStatus } from '../entity/manager/Meta';

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
    if(process.env.NODE_ENV !== "production") {
      redisInfo.redis.host = "localhost"
    }
    BullManager._instance.dataLoaderQueue = new Bull('dataLoader', redisInfo);
    BullManager._instance.metaLoaderQueue = new Bull('metaLoader', redisInfo);

    bullBoard.setQueues([BullManager._instance.dataLoaderQueue])
    bullBoard.setQueues([BullManager._instance.metaLoaderQueue])
    server.use('/bulls', bullBoard.UI)

    BullManager._instance.metaLoaderQueue.on('global:completed', function(jobId, result) {
      BullManager._instance.metaLoaderQueue.getJob(jobId).then(async function(job) {
        try {
          const metaId = job.data.metaId;

          const meta = await getRepository(Meta).findOneOrFail({
            where: {
              id: metaId
            }
          })
          const fileParam: MetaLoaderFileParam = {
            title: meta.title,
            skip: meta.skip,
            sheet: meta.sheet,
            filePath: meta.filePath,
            originalFileName: meta.originalFileName,
            ext: meta.extension
          }

          const loaderResult = await new ApiMetaController().loadMetaFromFile(fileParam);
          const loadedMeta:Meta = loaderResult.meta;
          const columns = loaderResult.columns;

          loadedMeta.dataType = meta.dataType;
          loadedMeta.remoteFilePath = meta.remoteFilePath;
          loadedMeta.id = meta.id;
          await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
            await transactionalEntityManager.save(loadedMeta);
            await transactionalEntityManager.save(columns);
          });
        } catch (err) {
          job.moveToFailed(err);
        }
      });
    });
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

  setMetaLoaderSchedule = async(metaId: number, url: string, fileName: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        await this.metaLoaderQueue.add({
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