import * as express from 'express';
import swagger from "swagger-ui-express";

import defaultRoutes from '../routes/defaultRoutes';
import metaRoutes from '../routes/metaRoutes';
import apiDatasetRoutes from '../routes/apiDatasetRoutes';
import apiRoutes from '../routes/apiRoutes';
import dbcRoutes from '../routes/databaseConnectionRoutes';
import applicationRoutes from '../routes/applicationRoutes';
import restApiRoutes from './restApiRoutes';
import { SwaggerBuilder } from "../util/SwaggerBuilder";


export default async function setupRoutes(server: express.Application) {
  server.use("/", defaultRoutes);
  server.use("/metas", metaRoutes);
  server.use("/api/dataset", apiDatasetRoutes);
  server.use("/apis", apiRoutes);
  server.use("/databaseConnections", dbcRoutes);
  server.use("/api-definition", swagger.serve, swagger.setup());
  server.use("/applications", applicationRoutes);
  server.use("/api", restApiRoutes);
}