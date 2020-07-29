import MetaLoadStrategy from "../MetaLoadStrategy";
import { Meta } from "../../entity/manager/Meta";
import * as Excel from 'exceljs';
import { MetaColumn } from "../../entity/manager/MetaColumn";
import MetaLoaderFileParam from "../interfaces/MetaLoaderFileParam";
import fs from 'fs';

const parse = require('csv-parse/lib/sync')
const iconv = require('iconv-lite');


class CsvMetaLoadStrategy implements MetaLoadStrategy {
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


        const file = iconv.decode(fs.readFileSync(filePath), 'euc-kr');

        const toLine = 2 + Number(skip);
        const records = parse(file.toString("utf-8"), {
          to_line: toLine,
          columns: true
        })

        if(records.length < 1) {
          reject(new Error('파일 정보가 잘못되었습니다.'));
        }

        const header = Object.keys(records[0]);

        const meta = new Meta();
        meta.title = title;
        meta.originalFileName = originalFileName;
        meta.filePath = filePath;
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

export default CsvMetaLoadStrategy;