import { User } from '../entity/manager/User';
import jwt from "jsonwebtoken";
import { NextFunction } from 'express';
import { stringify } from 'querystring';

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

export function getSecret() {
  return TOKEN_SECRET;
}

export function generateTokens(user: User): User {
  const token = jwt.sign({user}, TOKEN_SECRET, { expiresIn: "30s" })
  const refreshToken =  jwt.sign({user}, REFRESH_TOKEN_SECRET, { expiresIn: "5m" })
  user.token = token;
  user.refreshToken = refreshToken;
  return user
}


export function refreshTokens(refreshToken: string) {
  const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  const user = (<User>decoded)
  const tokens = generateTokens(user)
  return tokens
}

export function getUserFromToken(token: string):User {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    const user = (<User>decoded)
    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }
  
}