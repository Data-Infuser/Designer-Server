import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Application } from '../src/app';

process.env.NODE_ENV = 'test';

chai.use(chaiHttp);
describe('authApi', () => {
  

  it('it should Get new use info', async done => {
    const application = new Application()
    await application.setupDbAndServer();
    chai.request(application.app)
    .post('/api/oauth/regist')
    .end((err, res) => {
      expect(res).to.have.status(201);
      console.log("call success");
      done();
    })
  })


});