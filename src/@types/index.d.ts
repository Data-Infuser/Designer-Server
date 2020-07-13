import * as ProjectUser from '../entity/manager/User'; // <- User class
import { Request } from 'express';

declare global {
  namespace Express {
    export interface User extends ProjectUser.User { }
  }
}