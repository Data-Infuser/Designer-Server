import { InfuserUser } from '../controllers/api/AuthController';

declare global {
  namespace Express {
    export interface User extends InfuserUser { }
  }

  namespace Express.Multer {
    export interface File extends multerS3Int {  }
  }
}

interface multerS3Int {
  key: string
}