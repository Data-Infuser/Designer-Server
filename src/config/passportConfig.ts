import express from 'express';
import passport from 'passport';
import passportLocal from 'passport-local';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

export default function setupPassport(server: express.Application) {
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