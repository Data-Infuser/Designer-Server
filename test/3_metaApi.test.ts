import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";
import DbmsParams from '../src/interfaces/requestParams/DbmsParams';

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

  describe('Post /', () => {
    it('create new Meta with DBMS info', (done) => {
      const newMeta: DbmsParams = {
        stageId: applicationEntity.stages[0].id,
        title: "Database test Data",
        dbms: "mysql",
        host: "localhost",
        port: "3306",
        database: "api-manager",
        user: "root",
        password: "",
        table: "application"
      }
      chai.request(application.app)
      .post(`/api/metas/dbms`)
      .set('Authorization', `Bearer ${token}`)
      .send(newMeta)
      .end((err, res) => {
        expect(res).to.have.status(201);
        done();
      })
    })
  })
});