import * as grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";
import { getRepository, FindManyOptions, Like } from 'typeorm';
import { User } from "../entity/manager/User";
import { application } from 'express';
import { Application } from "../entity/manager/Application";
import { ApplicationServiceService, IApplicationServiceServer } from '../../infuser-protobuf/gen/proto/designer/application_grpc_pb';
import { ApplicationList as GApplicationList, ListApplicationRequest } from "../../infuser-protobuf/gen/proto/designer/application_pb";
import { Application as GApplication } from '../../infuser-protobuf/gen/proto/designer/application_pb';

class ApplicationServer implements IApplicationServiceServer {
  async listApplication(call: grpc.ServerUnaryCall<ListApplicationRequest>, callback: grpc.sendUnaryData<GApplicationList>): Promise<void> {
    try {
      var page = call.request.getPage();
      var perPage = call.request.getPerPage();
      var nameSpace = call.request.getNameSpace();

      if(!page) page = 1;
      if(!perPage) perPage = 10;

      const findOption:FindManyOptions = {
        select: ["id", "nameSpace", "title", "description" ,"status" ,"userId" ,"createdAt" ,"updatedAt"],
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
      
      
      const applicationList = new GApplicationList();
      applicationList.setTotalCount(findResult[1]);
      applicationList.setPage(page);
      applicationList.setPerPage(perPage);
      applicationList.setApplicationsList(findResult[0].map((app) => {
        const application = new GApplication();
        application.setId(app.id);
        application.setCreatedAt(app.createdAt.toDateString());
        application.setDescription(app.description);
        application.setNameSpace(app.nameSpace);
        application.setStatus(app.status);
        application.setTitle(app.title);
        application.setUpdatedAt(app.updatedAt.toDateString());
        application.setUserId(app.userId);
        return application;
      }))
      callback(null, applicationList);
    } catch (err) {
      callback(err, null);
    }
  };

}
export default function setupApplications(server: grpc.Server) {  
  server.addService<IApplicationServiceServer>(ApplicationServiceService, new ApplicationServer());
}