import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";
import ServiceParams from '../src/interfaces/requestParams/ServiceParams';
import { metas } from './3_metaApi.test';

describe('4-service Api', () => {
  
  it('token exist', (done) => {
    should().exist(token);
    done();
  });

  describe('Post /', () => {
    it('Create service', (done) => {
      const newService: ServiceParams = {
        metaId: metas[0].id,
        method: "GET",
        entityName: "test-service2",
        description: "테스트를 위한 service 입니다."
      }

      chai.request(application.app)
      .post(`/api/services`)
      .set('Authorization', `Bearer ${token}`)
      .send(newService)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["method", "entityName", "description", "userId", "meta", "id", "createdAt", "updatedAt"]);;
        expect(res.body.meta.id).to.equal(metas[0].id);
        done();
      });
    })

    it('Create service2', (done) => {
      const newService: ServiceParams = {
        metaId: metas[1].id,
        method: "GET",
        entityName: "test-service3",
        description: "테스트를 위한 service 입니다."
      }

      chai.request(application.app)
      .post(`/api/services`)
      .set('Authorization', `Bearer ${token}`)
      .send(newService)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["method", "entityName", "description", "userId", "meta", "id", "createdAt", "updatedAt"]);;
        expect(res.body.meta.id).to.equal(metas[1].id);
        done();
      });
    })
    
    it('Create service2', (done) => {
      const newService: ServiceParams = {
        metaId: metas[2].id,
        method: "GET",
        entityName: "test-service4",
        description: "테스트를 위한 service 입니다."
      }

      chai.request(application.app)
      .post(`/api/services`)
      .set('Authorization', `Bearer ${token}`)
      .send(newService)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["method", "entityName", "description", "userId", "meta", "id", "createdAt", "updatedAt"]);;
        expect(res.body.meta.id).to.equal(metas[2].id);
        done();
      });
    })
    
  })
});