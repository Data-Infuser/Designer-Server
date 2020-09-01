import {createConnections, getConnection} from "typeorm";
import { expect } from "chai";

const ormConfigJson = require("../ormconfig.json");

const defaultConnectionInfo = ormConfigJson[0];
const datasetConnectionInfo = ormConfigJson[1];

describe('database', () => {
  it('connect test manager db', async () => {
    await createConnections([
      {
        type: "mysql",
        host: process.env.DESIGNER_HOSTNAME || defaultConnectionInfo.host,
        port: Number(process.env.DESIGNER_PORT) || defaultConnectionInfo.port,
        username: process.env.DESIGNER_USERNAME || defaultConnectionInfo.username,
        password: process.env.DESIGNER_PASSWORD || defaultConnectionInfo.password,
        database: process.env.DESIGNER_DB_NAME || defaultConnectionInfo.database,
        entities: [__dirname + "/../src/entity/manager/*.ts"],
        subscribers: [__dirname + "/../src/subscriber/**/*.ts"],
        synchronize: false
      },
      {
        name: "dataset",
        type: "mysql",
        host: process.env.DESIGNER_DATASET_HOSTNAME || datasetConnectionInfo.host,
        port: Number(process.env.DESIGNER_DATASET_PORT) || datasetConnectionInfo.port,
        username: process.env.DESIGNER_DATASET_USERNAME || datasetConnectionInfo.username,
        password: process.env.DESIGNER_DATASET_PASSWORD || datasetConnectionInfo.password,
        database: process.env.DESIGNER_DATASET_DB_NAME || datasetConnectionInfo.database,
        entities: [__dirname + "/../src/entity/dataset/*.ts"],
        synchronize: false
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