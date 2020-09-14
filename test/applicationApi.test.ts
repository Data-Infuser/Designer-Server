import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { Application } from '../src/app';
import { ERROR_CODE } from '../src/util/ErrorCodes';
import { AuthResult } from '../src/lib/infuser-protobuf/gen/proto/author/auth_pb';
import { UserRes } from '../src/lib/infuser-protobuf/gen/proto/author/user_pb';
import { application } from './authApi.test';
import ApplicationParams from '../src/interfaces/requestParams/ApplicationParams';
import { getConnection } from 'typeorm';

describe('application Api', () => {
  let token;
  /**
   * Token 받아오기
   */
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

  /**
   * 테스트 시작 전 기존 Test DB에 들어있는 데이터 삭제
   */
  before((done) => {
    const connection = getConnection().synchronize(true).then( el => {
      done();
    });
  })

  it('token exist', async () => {
    should().exist(token);
  });

  it('application exist', async() => {
    should().exist(application.app);
  })

  describe('POST /', () => {

    it('create application', async() => {
      const applicationParams: ApplicationParams = {
        nameSpace: "test-api",
        title: "테스트를 위한 API 입니다.",
        description: "test를 하기 위한 API 입니다."
      }
      chai.request(application.app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send(applicationParams)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(['id', 'nameSpace', 'title', 'description', 'createdAt', 'updatedAt', "userId"]);
      })
    })
  })

});