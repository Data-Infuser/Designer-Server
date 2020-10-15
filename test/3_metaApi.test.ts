import chai, { expect, should } from 'chai';
import { token, application } from "./1_authApi.test";
import DbmsParams from '../src/interfaces/requestParams/DbmsParams';
import FileParams from '../src/interfaces/requestParams/FileParams';
import ServiceParams from '../src/interfaces/requestParams/ServiceParams';
import { MetaStatus } from '../src/entity/manager/Meta';
import { Column } from 'typeorm';

export let metas = [];

describe('3-meta Api', () => {
  let applicationEntity;
  let fileUrlMeta;
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
        title: "Database test data",
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
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["samples", "status", "columns", "createdAt", "dataType", "db", "dbUser", "dbms", "encoding", "extension", "filePath", "host", "id", "originalFileName", "port", "pwd", "remoteFilePath", "rowCounts", "sheet", "skip", "stage", "stageId", "table", "title", "updatedAt", "userId"]);
        should().exist(res.body.dbms);
        should().exist(res.body.host);
        should().exist(res.body.port);
        should().exist(res.body.pwd);
        should().exist(res.body.table);
        expect(res.body.status).equal(MetaStatus.METALOADED)
        metas.push(res.body);
        done();
      })
    })

    it('create new Meta with CSV File info', (done) => {
      const newMeta: FileParams = {
        stageId: applicationEntity.stages[0].id,
        dataType: "file",
        ext: "csv",
        title: "CSV File test data",
        skip: 0,
        sheet: 0,
        filePath: "./test/filesForTest/폐기물.csv",
        originalFileName: "폐기물.csv"
      }
      chai.request(application.app)
      .post(`/api/metas/file`)
      .set('Authorization', `Bearer ${token}`)
      .send(newMeta)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["samples", "status", "createdAt", "dataType", "db", "dbUser", "dbms", "encoding", "extension", "filePath", "host", "id", "originalFileName", "port", "pwd", "remoteFilePath", "rowCounts", "sheet", "skip", "stageId", "table", "title", "updatedAt", "userId"]);
        should().exist(res.body.dataType);
        should().exist(res.body.encoding);
        should().exist(res.body.extension);
        should().exist(res.body.filePath);
        should().exist(res.body.originalFileName);
        should().exist(res.body.sheet);
        should().exist(res.body.skip);
        should().exist(res.body.samples);
        expect(res.body.status).equal(MetaStatus.METALOADED)
        metas.push(res.body);
        done();
      })
    })

    it('create new Meta with XLSX File info', (done) => {
      const newMeta: FileParams = {
        stageId: applicationEntity.stages[0].id,
        dataType: "file",
        ext: "xlsx",
        title: "XLSX File test data",
        skip: 0,
        sheet: 0,
        filePath: "./test/filesForTest/그늘막설치현황.xlsx",
        originalFileName: "그늘막설치현황.xlsx"
      }
      chai.request(application.app)
      .post(`/api/metas/file`)
      .set('Authorization', `Bearer ${token}`)
      .send(newMeta)
      .end((err, res) => {
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["samples", "status", "createdAt", "dataType", "db", "dbUser", "dbms", "encoding", "extension", "filePath", "host", "id", "originalFileName", "port", "pwd", "remoteFilePath", "rowCounts", "sheet", "skip", "stageId", "table", "title", "updatedAt", "userId"]);
        should().exist(res.body.dataType);
        should().exist(res.body.extension);
        should().exist(res.body.filePath);
        should().exist(res.body.originalFileName);
        should().exist(res.body.sheet);
        should().exist(res.body.skip);
        should().exist(res.body.samples);
        expect(res.body.status).equal(MetaStatus.METALOADED)
        metas.push(res.body);
        done();
      })
    })

    it('create new Meta with File-url info', (done) => {
      const newMeta: FileParams = {
        stageId: applicationEntity.stages[0].id,
        dataType: "file-url",
        ext: "csv",
        title: "File test data",
        skip: 0,
        sheet: 0,
        url: "https://raw.githubusercontent.com/uiuc-cse/data-fa14/gh-pages/data/iris.csv"
      }
      chai.request(application.app)
      .post(`/api/metas/file`)
      .set('Authorization', `Bearer ${token}`)
      .send(newMeta)
      .end((err, res) => {
        fileUrlMeta = res.body;
        expect(res).to.have.status(201).and.have.property('body').and.have.keys(["samples", "status", "createdAt", "dataType", "db", "dbUser", "dbms", "encoding", "extension", "filePath", "host", "id", "originalFileName", "port", "pwd", "remoteFilePath", "rowCounts", "sheet", "skip", "stageId", "table", "title", "updatedAt", "userId"]);
        should().exist(res.body.dataType);
        should().exist(res.body.extension);
        should().exist(res.body.remoteFilePath);
        should().exist(res.body.sheet);
        should().exist(res.body.skip);
        expect(res.body.status).equal(MetaStatus.DOWNLOAD_SCHEDULED)
        setTimeout(() => {
          done();
        }, 1500)
      })
    })

    
    

  })

  let metaEntity;
  describe('GET /{id}', () => {
    it('File-url Meta Should be loaded', (done) => {
      chai.request(application.app)
      .get(`/api/metas/${fileUrlMeta.id}`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(200).and.have.property('body').and.have.property('status').to.satisfy((status) => {
          return status == MetaStatus.DOWNLOAD_DONE || status == MetaStatus.METALOADED
        })
        metaEntity = res.body
        metas.push(res.body);
        done();
      })
    })

    it('Sholud return 404 Error', (done) => {
      chai.request(application.app)
      .get(`/api/metas/100`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      })
    })

  })

  describe('PUT /{metaId}/columns', () => {

    it('Shoud meta column updated', (done) => {
      metaEntity.columns.forEach(column => {
        column.columnName = `${column.id}-column-${column.originalColumnName}`
        column.size = 100;
        column.isSearchable = true;
        column.isNullable = true;
        column["params"] = {
          metaColumnId: column.id,
          operator: "lt",
          description: "description",
          isRequired: false
        }
      });
      chai.request(application.app)
      .put(`/api/metas/${metaEntity.id}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        columns: metaEntity.columns
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        done();
      })
    })
  })

  describe('PUT /{metaId}', () => {
    it('Shoud meta column & service updated', (done) => {
      metaEntity.columns.forEach(column => {
        column.columnName = `${column.id}-column-${column.originalColumnName}-test2`
        column.size = 100;
        column.isSearchable = true;
        column.isNullable = true;
      });
      const service = {
        method: 'GET',
        entityName: 'test-service',
        description: '테스트를 위한 서비스입니다.\n서비스가 생성되어야 합니다.',
      }
      chai.request(application.app)
      .put(`/api/metas/${metaEntity.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        service: service,
        columns: metaEntity.columns
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        done();
      })
    })
  })

  describe('DELETE /{metaId}/service', () => {
    it('Meta should have null service', (done) => {
      chai.request(application.app)
      .delete(`/api/metas/${metaEntity.id}/service`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(201);
        done();
      })
    })
  })

  
  describe('Get /', () => {
    it('should have at least one stage and pagination info', (done) => {
      chai.request(application.app)
      .get('/api/metas')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if(err) console.log(err);
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(["items", "page", "perPage", "totalCount"]);
        done();
      })
    })

    it('should have NO stage', (done) => {
      chai.request(application.app)
      .get('/api/metas?page=100')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if(err) console.log(err);
        expect(res).to.have.status(200).and.have.property('body').and.have.keys(["items", "page", "perPage", "totalCount"]);
        expect(res.body.items.length).to.equal(0);
        done();
      })
    })

  })

});