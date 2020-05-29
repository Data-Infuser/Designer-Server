import * as ProjectUser from '../entity/manager/User'; // <- User class

declare global {
  namespace Express {
    export interface User extends ProjectUser.User { }
  }
}