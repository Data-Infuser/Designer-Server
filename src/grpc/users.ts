import * as grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";
import { getRepository } from 'typeorm';
import { User } from "../entity/manager/User";

export default function setupUsers(server) {
  const PROTO_PATH = './src/grpc/protos/users.proto';
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
  })

  const usersProto = grpc.loadPackageDefinition(packageDefinition);

  server.addService((<any>usersProto.UserService).service , {
    getAll: async (_, callback) => {
      const userRepo = getRepository(User);
      const users = await userRepo.find({
        select: ["id", "username"]
      });
      callback(null, {users})
    },

    get: (call, callback) => {
    },

    insert: (call, callback) => {
    },

    update: (call, callback) => {
    },

    remove: (call, callback) => {
    }
  });
}