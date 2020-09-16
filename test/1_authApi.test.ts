import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Application } from '../src/app';
import { ERROR_CODE } from '../src/util/ErrorCodes';
import { AuthResult } from '../src/lib/infuser-protobuf/gen/proto/author/auth_pb';
import { UserRes } from '../src/lib/infuser-protobuf/gen/proto/author/user_pb';
import { getConnection } from 'typeorm';

process.env.NODE_ENV = 'test';
process.env.DESIGNER_DB_NAME = 'designer-test'

chai.use(chaiHttp);
export let application: Application;
export let token;

before((done) => {
  application = new Application()
  application.setupDbAndServer().then(() => done()).catch((err) => console.error(err));
})

/**
 * 테스트 시작 전 기존 Test DB에 들어있는 데이터 삭제
 */
before((done) => {
  const connection = getConnection().synchronize(true).then( el => {
    done();
  });
})

after(async () => {
  application.server.close();
})

before((done) => {
  chai.request(application.app)
  .post('/api/oauth/login')
  .send({
    username: "admin",
    password: "admin"
  })
  .end((err, res) => {
    token = res.body.token;
    done();
  })
})

describe('1-authApi', () => {

  it('regist - duplicate_login_id', (done) => {
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
      done();
    })
  });

  it('regist - password_not_matched', (done) => {
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
      done()
    })
  });

  it('regist - duplicate_email', (done) => {
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
      done();
    })
  })

  it('login - NOT_REGISTERED', (done) => {
    chai.request(application.app)
    .post('/api/oauth/login')
    .send({
      username: "39!@(#$!H3k1j2-(#!U",
      password: "asdf"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.AUTH[AuthResult.NOT_REGISTERED]);
      done();
    })
  })

  it('login - INVALID_PASSWORD', (done) => {
    chai.request(application.app)
    .post('/api/oauth/login')
    .send({
      username: "admin",
      password: "asdfasdf"
    })
    .end((err, res) => {
      expect(res).to.have.status(401).and.have.property('body').and.have.property('code').to.equal(ERROR_CODE.AUTH[AuthResult.INVALID_PASSWORD]);
      done();
    })
  })

  it('login - SUCCESS', (done) => {
    chai.request(application.app)
    .post('/api/oauth/login')
    .send({
      username: "admin",
      password: "admin"
    })
    .end((err, res) => {
      expect(res).to.have.status(201).and.have.property('body').and.have.keys(['id', 'username', 'loginId', 'token', 'refreshToken', 'expireAt']);
      done();
    })
  })
});