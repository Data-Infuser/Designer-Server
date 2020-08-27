import { getRepository } from "typeorm";
import { User, UserInterface } from "../../entity/manager/User";
import { generateTokens, refreshTokens } from '../../util/JwtManager';
import { Route, Post, Body, Tags, SuccessResponse, Controller } from "tsoa";
import ApplicationError from "../../ApplicationError";

interface LoginParams {
  username: string,
  password: string
}

interface TokenParams {
  refreshToken: string
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
  ): Promise<UserInterface>{
    const { username, password } = loginPrams;
    const userRepo = getRepository(User);
    let currentUser = await userRepo.findOne({username: username})
    if (!currentUser || !currentUser.checkIfUnencryptedPasswordIsValid(password)) {
      throw new ApplicationError(401, "Unauthurized User");
    }
    currentUser = generateTokens(currentUser);
    return Promise.resolve(currentUser);
  }

  /**
   * refreshToken을 사용하여 token을 재발급 합니다.
   * @param refreshToken 
   */
  @Post("/token")
  @SuccessResponse('201', 'success to refresh token')
  public async refresh(
    @Body() refreshTokenParams: TokenParams
  ): Promise<User> {
    const { refreshToken } = refreshTokenParams;
    const user = refreshTokens(refreshToken)
    this.setStatus(201);
    return Promise.resolve(user);
  }
}

export default AuthController;