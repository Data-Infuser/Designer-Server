import mysqlTypes from "../../util/dbms_data_types/mysql.json";
import { MetaInfo } from "../../interfaces/MetaInfo";
import { createConnections, getManager, getConnection, ConnectionOptions } from "typeorm";
import { Meta } from "../../entity/manager/Meta";
import { MetaColumn } from "../../entity/manager/MetaColumn";
import MetaLoadStrategy from "../MetaLoadStrategy";
import MetaLoaderDbConnection from "../interfaces/MetaLoaderDbConnection";

class MysqlMetaLoadStrategy implements MetaLoadStrategy {

  typeConvertMap:{};

  constructor() {
    this.typeConvertMap = mysqlTypes;
  }
  
  async loadMeta(info:MetaLoaderDbConnection) {
    return new Promise<MetaInfo>(async(resolve, reject) => {
      try {
        let { title, hostname, port, database, username, password, tableNm } = info
        
        if(!password) password = ""

        const mysqlConnectionOption:ConnectionOptions = {
          name: "connectionForMeta",
          type: "mysql",
          host: hostname,
          port: Number(port),
          username: username,
          password: password,
          database: database
        }
        console.log(mysqlConnectionOption)
        await createConnections([mysqlConnectionOption])

        const manager = await getManager('connectionForMeta')
        const count = await manager
        .query(
          `SELECT count(*) as count
          FROM \`${tableNm}\`;`
          )
        const tableInfo = await manager.query(`DESCRIBE \`${tableNm}\`;`);

        const meta = new Meta();
        meta.title = title;
        meta.dataType = 'dbms';
        meta.rowCounts = count[0].count;
        meta.host = hostname;
        meta.port = port;
        meta.db = database;
        meta.dbUser = username;
        meta.pwd = password;
        meta.table = tableNm;

        let columns = []
        for(let i = 0; i < tableInfo.length; i++) {
          const info = tableInfo[i]
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = info.Field;
          metaCol.columnName = info.Field;
          const convertedType = this.convertType(info.Type);
          metaCol.type = convertedType.type;
          if(convertedType.size) metaCol.size = convertedType.size;
          metaCol.meta = meta;
          metaCol.order = i;
          columns.push(metaCol);
        }

        await getConnection('connectionForMeta').close();

        resolve({
          meta: meta, 
          columns: columns
        });
        return;
      } catch (err) {
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

export default MysqlMetaLoadStrategy;