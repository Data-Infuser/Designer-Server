import MetaLoadStrategy from "../MetaLoadStrategy";
import { Meta } from "../../entity/manager/Meta";
import * as Excel from 'exceljs';
import { MetaColumn } from "../../entity/manager/MetaColumn";
import MetaLoaderFileParam from "../interfaces/MetaLoaderFileParam";

class XlsxMetaLoadStrategy implements MetaLoadStrategy {
  async loadMeta(info:MetaLoaderFileParam) {
    return new Promise(async (resolve, reject) => {
      try{
        let { title, skip, sheet, filePath, originalFileName } = info;

        if(filePath == undefined) {
          reject(new Error('파일이 없습니다.'));
          return;
        }

        if(title == undefined || title.length == 0) {
          reject(new Error('Meta명이 없습니다.'));
          return;
        }        
        
        const originalFileNameTokens = originalFileName.split(".");
        const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
        const loadedWorkbook = await new Excel.Workbook().xlsx.readFile(filePath);
        const worksheet = loadedWorkbook.worksheets[sheet]
        const totalRowCount = worksheet.rowCount

        const header = worksheet.getRow(skip + 1).values;

        const meta = new Meta();
        meta.title = title;
        meta.originalFileName = originalFileName;
        meta.filePath = filePath;
        meta.rowCounts = totalRowCount - 1;
        meta.extension = ext;
        meta.skip = skip;
        meta.sheet = sheet;
        
        let columns = []
        for(let i = 1; i < header.length; i++) {
          const col = header[i];
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = col;
          metaCol.columnName = col;
          metaCol.meta = meta;
          metaCol.order = i;
          columns.push(metaCol);
        }
        
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
}

export default XlsxMetaLoadStrategy;