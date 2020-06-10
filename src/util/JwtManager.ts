import { User } from '../entity/manager/User';
import jwt from "jsonwebtoken";

const TOKEN_SECRET = "json-oauth-token"
const REFRESH_TOKEN_SECRET = "json-oauth-refresth-token"

interface TokenInterface {
  username: string,
  id: number,
  iat: number,
  exp: number
}

interface PayloadUserInfo {
  id: string|number,
  username: string
}

export function generateTokens(user: PayloadUserInfo) {
  const payloadUserInfo = {
    id: user.id,
    username: user.username
  }
  const token = jwt.sign(payloadUserInfo, TOKEN_SECRET, { expiresIn: "2d" })
  const refreshToken =  jwt.sign(payloadUserInfo, REFRESH_TOKEN_SECRET, { expiresIn: "30d" })

  return {
    token: token,
    refreshToken: refreshToken
  }
}

export function refreshTokens(refreshToken: string) {
  const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  const id = (<TokenInterface>decoded).id;
  const username = (<TokenInterface>decoded).username;

  const tokens = generateTokens({id: id, username: username})

  return tokens
}