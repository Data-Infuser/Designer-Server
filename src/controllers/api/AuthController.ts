import { getRepository } from "typeorm";
import { User, UserInterface } from "../../entity/manager/User";
import { generateTokens, refreshTokens } from '../../util/JwtManager';
import { Route, Post, Body, Tags } from "tsoa";
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
export class AuthController {
  
  /**
   * username과 password를 사용하여 JWT 를 발급합니다.
   * @param loginPrams usename: 사용자 이름, password: 비밀번호
   */
  @Post("/login")
  public async login(
    @Body() loginPrams: LoginParams
  ): Promise<UserInterface>{
    return new Promise(async function(resolve, reject) {
      const { username, password } = loginPrams;
      const userRepo = getRepository(User);
      try {
        let currentUser = await userRepo.findOne({username: username})
        if (!currentUser || !currentUser.checkIfUnencryptedPasswordIsValid(password)) {
          reject(new ApplicationError(401, "Unauthurized User"));
        }
        currentUser = generateTokens(currentUser);
        resolve(currentUser)
      } catch (err) {
        console.error(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }

  /**
   * refreshToken을 사용하여 token을 재발급 합니다.
   * @param refreshToken 
   */
  @Post("/token")
  public async refresh(
    @Body() refreshTokenParams: TokenParams
  ): Promise<User> {
    return new Promise(async function(resolve, reject) {
      const { refreshToken } = refreshTokenParams;
      try {
        const user = refreshTokens(refreshToken)
        resolve(user);
      } catch (err) {
        console.log(err);
        reject(new ApplicationError(500, err.message));
      }
    });
  }
}

export default AuthController;