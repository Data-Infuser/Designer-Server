import * as Excel from 'exceljs';
import { Meta } from '../entity/manager/Meta';

export class RowGenerator {
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
}