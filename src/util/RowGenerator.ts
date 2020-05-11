import * as Excel from 'exceljs';
import { Meta } from '../entity/manager/Meta';
import { createConnections, getManager, getConnection } from 'typeorm';

export class RowGenerator {
  static generateRows = async (meta:Meta, columnNames: string[]) => {
    switch(meta.dataType) {
      case 'file':
        return await RowGenerator.getRowsFromXlsx(meta);
      case 'dbms':
        return await RowGenerator.getRowsFromDbms(meta, columnNames);
        break;
      default:
        throw new Error(`available dataType ${meta.dataType}`);
    }
  }
  static getRowsFromXlsx = async (meta:Meta) => {
    let insertValues = []
    const loadedWorkbook = await new Excel.Workbook().xlsx.readFile(meta.filePath);
    const worksheet = loadedWorkbook.worksheets[meta.sheet]
    const totalRowCount = worksheet.rowCount
    for(let i = meta.skip + 2; i <= totalRowCount; i++) {
      let row = <string[]>worksheet.getRow(i).values
      if(row.length == 0) continue;
      insertValues.push(row.slice(1));
    }
    return insertValues
  }

  static getRowsFromDbms = async (meta:Meta, columnNames:string[]) => {
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

    let results = await manager.query(`SELECT ${columnNames.join(",")} FROM \`${meta.table}\``);

    results.forEach(row => {
      let values = []
      columnNames.forEach(col => {
        values.push(row[col])
      })
      insertValues.push(values)
    });
    await getConnection('connectionForMeta').close();
    return insertValues
  }
}