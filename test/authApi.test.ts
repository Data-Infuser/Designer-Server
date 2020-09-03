import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Application } from '../src/app';
import { ERROR_CODE } from '../src/util/ErrorCodes';
import { AuthResult } from '../src/lib/infuser-protobuf/gen/proto/author/auth_pb';
import { UserRes } from '../src/lib/infuser-protobuf/gen/proto/author/user_pb';

process.env.NODE_ENV = 'test';

chai.use(chaiHttp);
describe('authApi', () => {
  let application;
  let request;
  
  before(async () => {
    application = new Application()
    await application.setupDbAndServer();
    request = chai.request(application.app);
  })
  
  after(async () => {
    application.server.close();
  })

  it('regist - duplicate_login_id', async () => {
    /**
     * duplicate user
     */
    chai.request(application.app)
    .post('/api/oauth/regist')
    .send({
      username: "admin",
      password: "admin",
      passwordConfirm: "admin",
      name: "chunghyup",
      email: "chunghyup@gamil.com"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.REGIST[UserRes.Code.DUPLICATE_LOGIN_ID]);
    })
  });

  it('regist - password_not_matched', async () => {
    /**
     * password not match
     */
    chai.request(application.app)
    .post('/api/oauth/regist')
    .send({
      username: "asdjf9123kjfsadlfj1-2",
      password: "admin",
      passwordConfirm: "admin2",
      name: "asdrf392-0risa;dlof",
      email: "asd4129ufwadjs;f@gamil.com"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.REGIST[UserRes.Code.PASSWORD_NOT_MATCHED]);
    })
  });

  it('regist - duplicate_email', async () => {
    chai.request(application.app)
    .post('/api/oauth/regist')
    .send({
      username: "chunghyup-3",
      password: "admin2",
      passwordConfirm: "admin2",
      name: "asdrf392-0risa;dlof",
      email: "chunghyup.oh@gmail.com"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.REGIST[UserRes.Code.DUPLICATE_EMAIL]);
    })
  })

  it('login - NOT_REGISTERED', async () => {
    chai.request(application.app)
    .post('/api/oauth/login')
    .send({
      username: "39!@(#$!H3k1j2-(#!U",
      password: "asdf"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.AUTH[AuthResult.NOT_REGISTERED]);
    })
  })

  it('login - INVALID_PASSWORD', async () => {
    chai.request(application.app)
    .post('/api/oauth/login')
    .send({
      username: "admin",
      password: "asdfasdf"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.AUTH[AuthResult.INVALID_PASSWORD]);
    })
  })

  it('login - SUCCESS', async () => {
    chai.request(application.app)
    .post('/api/oauth/login')
    .send({
      username: "admin",
      password: "admin"
    })
    .end((err, res) => {
      expect(res).to.have.status(201).and.have.property('body').and.have.keys(['id', 'username', 'loginId', 'token', 'refreshToken', 'expireAt']);
    })
  })
});