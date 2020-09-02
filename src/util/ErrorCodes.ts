import { AuthResult } from '../lib/infuser-protobuf/gen/proto/author/auth_pb';
import { UserRes } from '../lib/infuser-protobuf/gen/proto/author/user_pb';

export const ERROR_CODE = {
    default: "GLOBAL_0001",
    AUTH: {
        [AuthResult.NOT_REGISTERED]: "AUTH_0001",
        [AuthResult.INVALID_PASSWORD]: "AUTH_0002",
        [AuthResult.WITHDRAWAL_USER]: "AUTH_0003",
        [AuthResult.INVALID_TOKEN]: "AUTH_0004"
    },
    REGIST: {
        [UserRes.Code.DUPLICATE_LOGIN_ID]: "REGIST_0001",
        [UserRes.Code.PASSWORD_NOT_MATCHED]: "REGIST_0002",
        [UserRes.Code.DUPLICATE_EMAIL]: "REGIST_0003"
    }
}