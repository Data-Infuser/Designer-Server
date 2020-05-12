import {createConnections, getConnection} from "typeorm";
import { expect } from "chai";

describe('database', () => {
  it('connect test manager db', async () => {
    await createConnections([
      {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "",
        database: "api-manager-test",
        entities: [__dirname + "/../src/entity/manager/*.ts"],
        subscribers: [__dirname + "/../src/subscriber/**/*.ts"],
        synchronize: true
      },
      {
        name: "dataset",
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "",
        database: "api-dataset-test",
        entities: [__dirname + "/../src/entity/dataset/*.ts"],
        synchronize: true
      }
    ])
    const defaultConnection = getConnection();
    const datasetConnection = getConnection("dataset");

    expect(defaultConnection.isConnected).to.equal(true);
    expect(datasetConnection.isConnected).to.equal(true);
    
    await getConnection("dataset").close()
    await getConnection().close()
  });
});