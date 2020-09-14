import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";

describe('3-meta Api', () => {
  let applicationEntity;

  before((done) => {
    chai.request(application.app)
    .get('/api/applications/1')
    .set('Authorization', `Bearer ${token}`)
    .end((err, res) => {
      if(err || res.error) throw err ? err : res.error;
      applicationEntity = res.body;
      done();
    })
  })

  it('token exist', (done) => {
    should().exist(token);
    done();
  });
});