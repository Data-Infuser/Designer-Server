import { InfuserUser } from '../controllers/api/AuthController';

declare global {
  namespace Express {
    export interface User extends InfuserUser { }
  }
}