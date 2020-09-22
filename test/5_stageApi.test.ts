import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";
import ServiceParams from '../src/interfaces/requestParams/ServiceParams';
import { MetaStatus } from '../src/entity/manager/Meta';
import { metas } from './3_metaApi.test';
import { Stage, StageStatus } from '../src/entity/manager/Stage';

describe('5-stage Api', () => {
  it('token exist', (done) => {
    should().exist(token);
    done();
  });

  describe('Get /', () => {
    let stageEntity;
    it('should have at least one stage and pagination info', (done) => {
      chai.request(application.app)
      .get('/api/stages')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if(err) console.log(err);
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(["items", "page", "perPage", "totalCount"]);
        stageEntity = res.body;
        done();
      })
    })

    it('item shoud have metas', (done) => {
      expect(stageEntity.items[0]).to.have.keys(["applicationId", "createdAt", "id", "metas", "name", "status", "updatedAt", "userId", "application"]);
      done();
    })

    it('should have NO stage', (done) => {
      chai.request(application.app)
      .get('/api/stages?page=100')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if(err) console.log(err);
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(["items", "page", "perPage", "totalCount"]);
        expect(res.body.items.length).to.equal(0);
        done();
      })
    })

  })

  describe('Get /{id}', () => {
    
    it('should have stage', (done) => {
      chai.request(application.app)
      .get('/api/stages/1')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if(err) console.log(err);
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(["metas", "id", "status", "applicationId", "name", "createdAt", "updatedAt", "userId", "application"]);
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
      let stage: Stage;
      before((done) => {
        const newService: ServiceParams = {
          metaId: metas[3].id,
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
          expect(res.body.meta.id).to.equal(metas[3].id);
          done();
        });
      })

      it('Should have return 201', (done) => {
        chai.request(application.app)
        .post('/api/stages/1/load-data')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(201);
          stage = res.body;
          done();
        });
      })

      it('Data loaded stage shoud have data-load-scheduled metas', (done) => {
        const haveScheduledMeta = stage.metas.every( meta => meta.status === MetaStatus.DATA_LOAD_SCHEDULED)
        expect(haveScheduledMeta).to.true;
        done();
      })

      it('should wait til Data loaded', (done) => {
        setTimeout(() => {
          done();
        }, 4500)
      }).timeout(5000);

      it('Should have return 200 and loaded', (done) => {
        chai.request(application.app)
        .get('/api/stages/1')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          stage = res.body;
          expect(stage.status).to.equal(StageStatus.LOADED);
          done();
        });
      })
      
    })

  })
});