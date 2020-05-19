import * as Excel from 'exceljs';
import { Meta } from '../entity/manager/Meta';
import { createConnections, getManager, getConnection } from 'typeorm';

export class RowGenerator {
  static generateRows = async (meta:Meta, originalColumnNames?: string[]) => {
    try {
      switch(meta.dataType) {
        case 'file':
          return await RowGenerator.getRowsFromXlsx(meta);
        case 'dbms':
          return await RowGenerator.getRowsFromDbms(meta, originalColumnNames);
        default:
          throw new Error(`available dataType ${meta.dataType}`);
      }
    } catch(err) {
      throw err;
    }
  }
  
  static getRowsFromXlsx = async (meta:Meta) => {
    return new Promise<any>(async(resolve, reject) => {
      try {
        let insertValues = []
        const loadedWorkbook = await new Excel.Workbook().xlsx.readFile(meta.filePath);
        const worksheet = loadedWorkbook.worksheets[meta.sheet]
        const totalRowCount = worksheet.rowCount
        for(let i = meta.skip + 2; i <= totalRowCount; i++) {
          let row = <string[]>worksheet.getRow(i).values
          if(row.length == 0) continue;
          insertValues.push(row.slice(1));
        }
        resolve(insertValues);
      } catch(err) {
        reject(err);
      }
    }) 
  }

  static getRowsFromDbms = async (meta:Meta, originalColumnNames:string[]) => {
    return new Promise<any>(async(resolve, reject) => {
      try {
        let insertValues = []
        await createConnections([{
          name: "connectionForMeta",
          type: "mysql",
          host: meta.host,
          port: Number(meta.port),
          username: meta.dbUser,
          password: meta.pwd,
          database: meta.db
        }])

        const manager = await getManager('connectionForMeta');

        let results = await manager.query(`SELECT ${originalColumnNames.join(",")} FROM \`${meta.table}\`;`);

        results.forEach(row => {
          let values = []
          originalColumnNames.forEach(col => {
            values.push(row[col.slice(1, -1)])
          })
          insertValues.push(values)
        });
        await getConnection('connectionForMeta').close();
        resolve(insertValues);
      } catch(err) {
        reject(err);
      }
    });
    
  }
}