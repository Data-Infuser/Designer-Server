import * as express from 'express';
import defaultRoutes from '../routes/defaultRoutes';
import metaRoutes from '../routes/metaRoutes';

export default function setupRoutes(server: express.Application) {
  server.use("/", defaultRoutes);
  server.use("/metas", metaRoutes);
}