import express from 'express';
import bullBoard from 'bull-board';
import Bull from 'bull';
import { Application, ApplicationStatus } from '../entity/manager/Application';
import MetaLoadStrategy from '../lib/MetaLoadStrategy';
import XlsxMetaLoadStrategy from '../lib/strategies/XlsxMetaLoadStrategy';
import CsvMetaLoadStrategy from '../lib/strategies/CsvMetaLoadStrategy';
import MetaLoader from '../lib/MetaLoader';
import { getRepository, getManager } from 'typeorm';
import { Service, ServiceStatus } from '../entity/manager/Service';
import MetaLoaderFileParam from '../lib/interfaces/MetaLoaderFileParam';
import { ApiMetaController } from '../controllers/api/ApiMetaController';

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

    BullManager._instance.metaLoaderQueue.on('global:completed', function(jobId, result) {
      BullManager._instance.metaLoaderQueue.getJob(jobId).then(async function(job) {
        try {
          const serviceId = job.data.serviceId;

          const service = await getRepository(Service).findOneOrFail({
            relations: ["meta"],
            where: {
              id: serviceId
            }
          })
          const fileParam: MetaLoaderFileParam = {
            title: service.meta.title,
            skip: service.meta.skip,
            sheet: service.meta.sheet,
            filePath: service.meta.filePath,
            originalFileName: service.meta.originalFileName,
            ext: service.meta.extension
          }

          const loaderResult = await new ApiMetaController().loadMetaFromFile(fileParam);
          const meta = loaderResult.meta;
          const columns = loaderResult.columns;
          
          await getManager().transaction("SERIALIZABLE", async transactionalEntityManager => {
            await transactionalEntityManager.remove(service.meta);
            await transactionalEntityManager.save(meta);
            await transactionalEntityManager.save(columns);
            service.status = ServiceStatus.METALOADED;
            service.meta = meta;
            await transactionalEntityManager.save(service);
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

  setMetaLoaderSchedule = async(serviceId: number, url: string, fileName: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {    
        await this.metaLoaderQueue.add({
          serviceId,
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