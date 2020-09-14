import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { Application } from '../src/app';
import { ERROR_CODE } from '../src/util/ErrorCodes';
import { AuthResult } from '../src/lib/infuser-protobuf/gen/proto/author/auth_pb';
import { UserRes } from '../src/lib/infuser-protobuf/gen/proto/author/user_pb';
import { application } from './authApi.test';

describe('application Api', () => {
  let token;
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

  it('token exist', async () => {
    should().exist(token);
  });

  it('application exist', async() => {
    should().exist(application.app);
  })
});