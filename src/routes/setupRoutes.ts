import * as express from 'express';
import defaultRoutes from '../routes/defaultRoutes';
import apiRoutes from '../routes/apiRoutes';

export default function setupRoutes(server: express.Application) {
  server.use("/", defaultRoutes);
  server.use("/apis", apiRoutes);
}