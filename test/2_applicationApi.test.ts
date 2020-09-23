import chai, { expect, should } from 'chai';
import { application, token } from './1_authApi.test';
import ApplicationParams from '../src/interfaces/requestParams/ApplicationParams';
import { TrafficConfigType } from '../src/entity/manager/TrafficConfig';

describe('2-application Api', () => {

  it('token exist', (done) => {
    should().exist(token);
    done();
  });

  it('application exist', (done) => {
    should().exist(application.app);
    done();
  })

  describe('POST /', () => {
    let applicationEntity;
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
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(['id', 'nameSpace', 'title', 'description', 'createdAt', 'updatedAt', 'userId', 'trafficConfigs', 'stages', 'lastStageVersion']);
        applicationEntity = res.body
        done();
      })
    })

    it('shoud have daily & monthly traffic configs', (done) => {
      const typeList = applicationEntity.trafficConfigs.map(el => el.type);
      expect(typeList).includes(TrafficConfigType.DAY).and.includes(TrafficConfigType.MONTH);
      done();
    })

    it('shoud have stages with length 1', (done) => {
      const stages = applicationEntity.stages;
      expect(stages).to.have.length(1);
      done();
    })

    it('lastVersion should be same as stage name', (done) => {
      expect(applicationEntity.stages[0].name).equal(`${applicationEntity.lastStageVersion}`);
      done();
    })
  })
});