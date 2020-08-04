
import { ConnectionOptions } from 'typeorm';

const ormConfigJson = require("../../ormconfig.json");

const  defaultConnection: ConnectionOptions = {
  type: "mysql",
  host: process.env.DESIGNER_HOSTNAME || ormConfigJson.dafaultConnection.host,
  port: Number(process.env.DESIGNER_PORT) || ormConfigJson.dafaultConnection.port,
  username: process.env.DESIGNER_USERNAME || ormConfigJson.dafaultConnection.username,
  password: process.env.DESIGNER_PASSWORD || ormConfigJson.dafaultConnection.password,
  database: process.env.DESIGNER_DB_NAME || ormConfigJson.dafaultConnection.database,
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
  type: "mysql",
  name: "dataset",
  host: process.env.DESIGNER_DATASET_HOSTNAME || ormConfigJson.datasetConnection.host,
  port: Number(process.env.DESIGNER_DATASET_PORT) || ormConfigJson.datasetConnection.port,
  username: process.env.DESIGNER_DATASET_USERNAME || ormConfigJson.datasetConnection.username,
  password: process.env.DESIGNER_DATASET_PASSWORD || ormConfigJson.datasetConnection.password,
  database: process.env.DESIGNER_DATASET_DB_NAME || ormConfigJson.datasetConnection.database,
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
