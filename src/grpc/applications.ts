import * as grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";
import { getRepository, FindManyOptions, Like } from 'typeorm';
import { User } from "../entity/manager/User";
import { application } from 'express';
import { Application } from "../entity/manager/Application";

export default function setupApplications(server) {
  const PROTO_PATH = './src/grpc/protos/applications.proto';
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
  })

  const applicationProto = grpc.loadPackageDefinition(packageDefinition);

  server.addService((<any>applicationProto.ApplicationService).service , {
    listApplication: async (call, callback) => {
      console.log(call);
      try {
        var { perPage, page, nameSpace } = call.request

        if(!page) page = 1;
        if(!perPage) perPage = 10;

        const findOption:FindManyOptions = {
          select: ["id", "nameSpace", "title", "description" ,"status" ,"userId" ,"createdAt" ,"updatedAt"],
          relations: ["services", "services.columns"],
          skip: perPage*(page - 1),
          take: perPage,
          order: {
            id: 'ASC'
          },
          where: {}
        }

        if (nameSpace) {
          findOption.where["nameSpace"] = Like(`%${nameSpace}%`)
        }
        const applicationRepo = getRepository(Application);
        const findResult = await applicationRepo.findAndCount(findOption);
        callback(null, {
          totalCount: findResult[1],
          page: page,
          perPage: perPage,
          Applications: findResult[0]
        });
      } catch (err) {
        callback(err, null);
      }
      
    }
  });
}