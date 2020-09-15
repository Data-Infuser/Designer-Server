import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";
import DbmsParams from '../src/interfaces/requestParams/DbmsParams';
import FileParams from '../src/interfaces/requestParams/FileParams';
import ServiceParams from '../src/interfaces/requestParams/ServiceParams';
import { MetaStatus } from '../src/entity/manager/Meta';

describe('4-service Api', () => {

  it('token exist', (done) => {
    should().exist(token);
    done();
  });

  describe('Post /', () => {
    it('Create service', (done) => {
      const metaId = 1;
      const newService: ServiceParams = {
        metaId: metaId,
        method: "GET",
        entityName: "test-service",
        description: "테스트를 위한 service 입니다."
      }

      chai.request(application.app)
      .post(`/api/services`)
      .set('Authorization', `Bearer ${token}`)
      .send(newService)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["method", "entityName", "description", "userId", "meta", "id", "createdAt", "updatedAt"]);;
        expect(res.body.meta.id).to.equal(metaId);
        done();
      });
    })
  })
});