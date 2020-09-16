import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";
import DbmsParams from '../src/interfaces/requestParams/DbmsParams';
import FileParams from '../src/interfaces/requestParams/FileParams';
import ServiceParams from '../src/interfaces/requestParams/ServiceParams';
import { MetaStatus, Meta } from '../src/entity/manager/Meta';
import { metas } from './3_metaApi.test';
import { Stage, StageStatus } from '../src/entity/manager/Stage';
import { getRepository } from 'typeorm';

describe('5-stage Api', () => {
  it('token exist', (done) => {
    should().exist(token);
    done();
  });

  describe('Get /{id}', () => {
    
    it('should have stage', (done) => {
      chai.request(application.app)
      .get('/api/stages/1')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if(err) console.log(err);
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(["metas", "id", "status", "applicationId", "name", "createdAt", "updatedAt"]);;;
        done();
      })
    })

  })

  describe('POST /{id}/load-data', () => {

    it('Should have return 400 because of Service Not yet ready', (done) => {
      chai.request(application.app)
      .post('/api/stages/1/load-data')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.code).to.equal("All metas should have service before load data")
        done();
      });
    })

    

    describe('... save sample data ...', () => {

      before((done) => {
        const newService: ServiceParams = {
          metaId: metas[2].id,
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
          expect(res.body.meta.id).to.equal(metas[2].id);
          done();
        });
      })

      it('Should have return 201', (done) => {
        chai.request(application.app)
        .post('/api/stages/1/load-data')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(201);
          done();
        });
      })
    })

    

  })
});