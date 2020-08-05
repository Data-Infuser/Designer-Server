
import { ConnectionOptions } from 'typeorm';

const ormConfigJson = require("../../ormconfig.json");

const defaultConnectionInfo = ormConfigJson[0];
const datasetConnectionInfo = ormConfigJson[1];

const  defaultConnection: ConnectionOptions = {
  type: "mariadb",
  host: process.env.DESIGNER_HOSTNAME || defaultConnectionInfo.host,
  port: Number(process.env.DESIGNER_PORT) || defaultConnectionInfo.port,
  username: process.env.DESIGNER_USERNAME || defaultConnectionInfo.username,
  password: process.env.DESIGNER_PASSWORD || defaultConnectionInfo.password,
  database: process.env.DESIGNER_DB_NAME || defaultConnectionInfo.database,
  synchronize: true,
  logging: true,
  entities: [
    "src/entity/manager/*{.ts,.js}"
  ],
  migrations: [
    "src/migration/**/*.ts"
  ],
  subscribers: [
    "src/subscriber/**/*.ts"
  ],
  cli: {
    "entitiesDir": "src/entity/manager",
    "migrationsDir": "src/migration",
    "subscribersDir": "src/subscriber"
  }
}

const datasetConnection: ConnectionOptions =  {
  type: "mariadb",
  name: "dataset",
  host: process.env.DESIGNER_DATASET_HOSTNAME || datasetConnectionInfo.host,
  port: Number(process.env.DESIGNER_DATASET_PORT) || datasetConnectionInfo.port,
  username: process.env.DESIGNER_DATASET_USERNAME || datasetConnectionInfo.username,
  password: process.env.DESIGNER_DATASET_PASSWORD || datasetConnectionInfo.password,
  database: process.env.DESIGNER_DATASET_DB_NAME || datasetConnectionInfo.database,
  synchronize: false,
  logging: true,
  entities: [
    "src/entity/dataset/*.ts"
  ]
}

const ormConfigs = {
  defaultConnection,
  datasetConnection
}

export default ormConfigs;
