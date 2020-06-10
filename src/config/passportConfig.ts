import express from 'express';
import passport from 'passport';
import passportLocal from 'passport-local';
import { getRepository } from 'typeorm';
import { User } from '../entity/manager/User';
import passportJwt from 'passport-jwt';
import { getSecret } from '../util/JwtManager';

export default function setupPassport(server: express.Application) {
  setupLocalPassport(server);
  setupJwtPassport(server);
}

function setupLocalPassport(server: express.Application) {
  const userRepo = getRepository(User)

  passport.use('local', new passportLocal.Strategy({
    usernameField: "username",
    passwordField: "password"
  }, async function(username: string, password: string, done: Function) {
    const currentUser = await userRepo.findOne({username: username})
    if (!currentUser || !currentUser.checkIfUnencryptedPasswordIsValid(password)) {
      done(null, false, { type: 'danger', message: '계정이 유효하지 않습니다.' })
    }

    return done(null, currentUser)
  }));

  passport.serializeUser(function(user, done) {
    done(null, user); 
  });

  passport.deserializeUser(function(user, done) {
    done(null, user)
  });

  server.use(passport.initialize())
  server.use(passport.session());
}

function setupJwtPassport(server: express.Application) {
  const userRepo = getRepository(User);
  var JwtStrategy = passportJwt.Strategy,
    ExtractJwt = passportJwt.ExtractJwt;

  var opts = {
    jwtFromRequest: null,
    secretOrKey: null,
    issuer: undefined,
    audience: undefined
  }

  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = getSecret();
  passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    try {
      const user = await userRepo.findOne(jwt_payload.id);
      if(user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  }));
}