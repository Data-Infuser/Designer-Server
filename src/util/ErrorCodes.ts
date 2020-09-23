import { AuthResult } from '../lib/infuser-protobuf/gen/proto/author/auth_pb';
import { UserRes } from '../lib/infuser-protobuf/gen/proto/author/user_pb';

export const ERROR_CODE = {
  default: "GLOBAL_0001",
  AUTH: {
    [AuthResult.NOT_REGISTERED]: "AUTH_0001",
    [AuthResult.INVALID_PASSWORD]: "AUTH_0002",
    [AuthResult.WITHDRAWAL_USER]: "AUTH_0003",
    [AuthResult.INVALID_TOKEN]: "AUTH_0004",
  },
  REGIST: {
    [UserRes.Code.DUPLICATE_LOGIN_ID]: "REGIST_0001",
    [UserRes.Code.PASSWORD_NOT_MATCHED]: "REGIST_0002",
    [UserRes.Code.DUPLICATE_EMAIL]: "REGIST_0003"
  },
  APPLICATION: {
    APPLICATION_NOT_FOUND: "APPLICATION_001"
  },
  STAGE: {
    STAGE_NOT_FOUND: "STAGE_001",
    ALL_METAS_SHOULD_BE_LOADED: "STAGE_002",
    ALL_METAS_SHOULD_HAVE_SERVICE: "STAGE_003",
    STAGE_NOT_LOADED: "STAGE_004",
    STAGE_NOT_DEPLOYED: "STAGE_005"
  },
  META: {
    META_NOT_FOUND: "META_001",
    NEED_ALL_PARAM: "META_002",
    UNACCEPTABLE_DBMS: "META_003",
    UNACCEPTABLE_FILE_TYPE: "META_004",
    UNACCEPTABLE_FILE_EXT: "META_005"
  },
  SERVICE: {
    SERVICE_NOT_FOUND: "SERVICE_001",
    NEED_ALL_PARAM: "SERVICE_002"
  }
}