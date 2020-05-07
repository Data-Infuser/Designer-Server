import * as express from 'express';
import defaultRoutes from '../routes/defaultRoutes';
import metaRoutes from '../routes/metaRoutes';
import apiDatasetRoutes from '../routes/apiDatasetRoutes';

export default function setupRoutes(server: express.Application) {
  server.use("/", defaultRoutes);
  server.use("/metas", metaRoutes);
  server.use("/api/dataset", apiDatasetRoutes);
}