import mysqlTypes from "../../util/dbms_data_types/mysql.json";
import { MetaInfo } from "../../interfaces/MetaInfo";
import { createConnections, getManager, getConnection, ConnectionOptions } from "typeorm";
import { Meta } from "../../entity/manager/Meta";
import { MetaColumn } from "../../entity/manager/MetaColumn";
import MetaLoadStrategy from "../MetaLoadStrategy";
import MetaLoaderDbConnection from "../interfaces/MetaLoaderDbConnection";
import CUBRID = require('node-cubrid');

class CubridMetaLoadStrategy implements MetaLoadStrategy {

  typeConvertMap:{};

  constructor() {
    this.typeConvertMap = mysqlTypes;
  }
  
  async loadMeta(info:MetaLoaderDbConnection) {
    /**
     * Cubrid Query Result
     * {
     *  queryHandle: number,
     *  result : {
     *    ColumnDataTypes: [],
     *    ColumnNames: [],
     *    ColumnValues: [[]]
     *  }
     * }
     */
    return new Promise<MetaInfo>(async(resolve, reject) => {
      let client;
      try {
        let { title, hostname, port, database, username, password, tableNm } = info
        
        if(!password) password = ""

        const dbConfig = {
          host: hostname,
          port: Number(port),
          user: username,
          password: password,
          database: database
        }
        client = CUBRID.createConnection(dbConfig);
        await client.connect();

        const countQuery = `SELECT COUNT(*) FROM \`${tableNm}\`;`
        const countResult = await client.query(countQuery);
        const count = countResult.result.ColumnValues[0][0];

        const describeQuery = `DESCRIBE \`${tableNm}\`;`
        /**
         * Curid describe result
         * | Field | Type | Null | Key | Default | Extra | - 모든 Column은 String
         */

        const describeResult = await client.query(describeQuery);

        const meta = new Meta();
        meta.title = title;
        meta.dataType = 'dbms';
        meta.rowCounts = count;
        meta.host = hostname;
        meta.port = port;
        meta.db = database;
        meta.dbUser = username;
        meta.pwd = password;
        meta.table = tableNm;

        let columns = []
        for(let i = 0; i < describeResult.result.ColumnValues.length; i++) {
          const info = describeResult.result.ColumnValues[i]
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = info[0];
          metaCol.columnName = info[0];
          const convertedType = this.convertType(info[1]);
          metaCol.type = convertedType.type;
          if(convertedType.size) metaCol.size = convertedType.size;
          metaCol.meta = meta;
          metaCol.order = i;
          columns.push(metaCol);
        }

        await client.close();

        resolve({
          meta: meta, 
          columns: columns
        });
        return;
      } catch (err) {
        await client.close();
        reject(err);
        return;
      }
    });
  }


  convertType(originType: string){
    const lowercaseType:string = originType.toLowerCase()
    const tokens = lowercaseType.split("(");
    let type = this.typeConvertMap[tokens[0]]
    let size:number;

    if(tokens[1]) {
      let candidateSize = Number(tokens[1].split(")")[0]);
      if(!isNaN(candidateSize)) size = candidateSize;
    }
    
    if(!type) type = "varchar"

    return {
      type: type,
      size: size
    }
  }
}

export default CubridMetaLoadStrategy;