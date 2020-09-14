import chai, { expect, should } from 'chai';
import { application, token } from './1_authApi.test';
import ApplicationParams from '../src/interfaces/requestParams/ApplicationParams';

describe('2-application Api', () => {

  it('token exist', async () => {
    should().exist(token);
  });

  it('application exist', async() => {
    should().exist(application.app);
  })

  describe('POST /', () => {
    it('create application', (done) => {
      const applicationParams: ApplicationParams = {
        nameSpace: "test-api",
        title: "테스트를 위한 API 입니다.",
        description: "test를 하기 위한 API 입니다.",
        dailyMaxCount: 1000,
        monthlyMaxCount: 10000
      }
      chai.request(application.app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send(applicationParams)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(['id', 'nameSpace', 'title', 'description', 'createdAt', 'updatedAt', 'userId', 'trafficConfigs']);
        done();
      })
    })
  })

  describe('GET /', () => {
    it('get application', (done) => {
      chai.request(application.app)
      .get('/api/applications/1')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(['id', 'nameSpace', 'title', 'description', 'createdAt', 'updatedAt', 'userId', 'services', 'stages', 'trafficConfigs']);
        done();
      })
    })
  })

});