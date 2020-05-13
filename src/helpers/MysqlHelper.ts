import { ConnectionOptions, createConnections, getManager, getConnection } from "typeorm";
import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";
import mysqlTypes from "../util/dbms_data_types/mysql.json";


export class MysqlHelper {
  static getTables = async(connectOption: ConnectionOptions) => {
    return new Promise(async(resolve, reject) => {
      const name = connectOption.name;
      let tables = []
      try {
        await createConnections([connectOption])
        const manager = await getManager(name)
        const results = await manager.query("SHOW tables;");
        
        
        results.forEach(row => {
          tables.push(row[`Tables_in_${connectOption.database}`]);
        });
      } catch(err) {
        getConnection(name).close();
        reject(err);
        return;
      } finally {
        getConnection(name).close();
      }
      resolve(tables);
    });
  };

  static getColumns = async(connectOption: ConnectionOptions, table: string):Promise<MetaColumn[]> => {
    return new Promise(async(resolve, reject) => {
      const name = connectOption.name;
      let mysqlDescribeResults:MysqlDescribeResult[] = []
      let columns: MetaColumn[] = []
      try {
        await createConnections([connectOption])
        const manager = await getManager(name)
        mysqlDescribeResults = await manager.query(`DESCRIBE \`${table}\`;`);
        mysqlDescribeResults.forEach( result => {
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = result.Field;
          metaCol.columnName = result.Field;
          const convertedType = MysqlHelper.convertType(result.Type);
          metaCol.type = convertedType.type;
          if(convertedType.size) metaCol.size = convertedType.size;
          columns.push(metaCol);
        })
      } catch(err) {
        getConnection(name).close();
        reject(err);
        return;
      } finally {
        getConnection(name).close();
      }
      resolve(columns);
    })
  }

  static convertType(originType: string){
    const lowercaseType:string = originType.toLowerCase()
    const tokens = lowercaseType.split("(");
    let type = mysqlTypes[tokens[0]]
    let size
  
    if(tokens[1]) {
      size = tokens[1].split(")")[0];
    }
    
    if(!type) type = "varchar"
  
    return {
      type: type,
      size: size
    }
  }
}