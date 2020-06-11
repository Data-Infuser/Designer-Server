import { getRepository } from "typeorm";
import { User } from "../../entity/manager/User";
import { generateTokens, refreshTokens } from '../../util/JwtManager';
import { Route, Post, Body } from "tsoa";

interface LoginParams {
  username: string,
  password: string
}
@Route("/api/oauth")
export class AuthController {
  
  @Post("/login")
  public async login(
    @Body() loginPrams: LoginParams
  ): Promise<User>{
    return new Promise(async function(resolve, reject) {
      const { username, password } = loginPrams;
      const userRepo = getRepository(User);
      try {
        let currentUser = await userRepo.findOne({username: username})
        if (!currentUser || !currentUser.checkIfUnencryptedPasswordIsValid(password)) {
          reject({
            message: "invalid user info"
          })
        }
        currentUser = generateTokens(currentUser);
        resolve(currentUser)
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  @Post("/token")
  public async refresh(
    @Body() refreshToken: string
  ): Promise<User> {
    return new Promise(async function(resolve, reject) {
      try {
        const user = refreshTokens(refreshToken)
        resolve(user);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default AuthController;