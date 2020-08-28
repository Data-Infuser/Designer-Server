import { Request as exRequest } from "express";
import { getRepository } from "typeorm";
import { User, UserInterface } from "../../entity/manager/User";
import { generateTokens, refreshTokens } from '../../util/JwtManager';
import { Route, Post, Body, Tags, SuccessResponse, Controller, Get, Security, Request } from "tsoa";
import InfuserGrpcAuthorClient from "../../grpc/InfuserGrpcAuthorClient";
import RedisManager from "../../util/RedisManager";

const property = require("../../../property.json");

interface LoginParams {
  username: string,
  password: string
}

interface TokenParams {
  refreshToken: string
}

export interface InfuserUser {
  userId: number,
  username: string,
  token: string,
  refreshToken: string,
  expireAt: number
}
@Route("/api/oauth")
@Tags("Auth")
export class AuthController extends Controller {
  
  /**
   * username과 password를 사용하여 JWT 를 발급합니다.
   * @param loginPrams usename: 사용자 이름, password: 비밀번호
   */
  @Post("/login")
  public async login(
    @Body() loginPrams: LoginParams
  ): Promise<InfuserUser>{
    const { username, password } = loginPrams;
    const authResponse = await InfuserGrpcAuthorClient.Instance.login(username, password);
    const infuserUser:InfuserUser = {
      userId: 1,
      username: username,
      token: authResponse.jwt,
      refreshToken: authResponse.refreshToken,
      expireAt: authResponse.expiresIn.seconds
    }
    await RedisManager.Instance.setUserToken(infuserUser);
    this.setStatus(201);
    return Promise.resolve(infuserUser);
  }

  /**
   * refreshToken을 사용하여 token을 재발급 합니다.
   * @param refreshToken 
   */
  @Post("/token")
  @SuccessResponse('201', 'success to refresh token')
  public async refresh(
    @Body() refreshTokenParams: TokenParams
  ): Promise<InfuserUser> {
    const { refreshToken } = refreshTokenParams;
    const authResponse = await InfuserGrpcAuthorClient.Instance.refresh(refreshToken);
    const infuserUser:InfuserUser = {
      userId: 1,
      username: "admin",
      token: authResponse.jwt,
      refreshToken: authResponse.refreshToken,
      expireAt: authResponse.expiresIn.seconds
    }
    await RedisManager.Instance.setUserToken(infuserUser);
    this.setStatus(201);
    return Promise.resolve(infuserUser);
  }

  @Get("/me")
  @Security("bearer")
  @SuccessResponse('200', 'success to refresh token')
  public async me(
    @Request() request: exRequest
  ): Promise<User> {
    return Promise.resolve(request.user);
  }
}

export default AuthController;