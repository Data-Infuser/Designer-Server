import MetaLoadStrategy from "../MetaLoadStrategy";
import { Meta } from "../../entity/manager/Meta";
import { MetaColumn, AcceptableType } from "../../entity/manager/MetaColumn";
import MetaLoaderFileParam from "../interfaces/MetaLoaderFileParam";
import fs from 'fs';
import moment from 'moment';

const parse = require('csv-parse/lib/sync')
const iconv = require('iconv-lite');
const jschardet = require('jschardet');

const MAX_LINE = 1000;

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

        const fileStream = fs.createReadStream(filePath);
        let chunks = [];
        let rowCounts = 0;

        fileStream.on('error', (err) => {
          throw err;
        })
        .on('data', (chunk) => {
          const count = chunk.toString().split('\n').length - 1;
          rowCounts = rowCounts + count;
          chunks.push(chunk);
          if(rowCounts >= MAX_LINE) fileStream.close();
        })
        .on('end', () => {
          const concatedBuffer = Buffer.concat(chunks);
          const encoding = jschardet.detect(concatedBuffer).encoding;
          const file = iconv.decode(concatedBuffer, encoding);
          const toLine = 1 + Number(skip);

          const records = parse(file.toString("utf-8"), {
            to_line: toLine + MAX_LINE
          })

          if(records.length < 1) {
            reject(new Error('파일 정보가 잘못되었습니다.'));
          }
          const header = records[0];

          const meta = new Meta();
          meta.title = title;
          meta.originalFileName = originalFileName;
          meta.filePath = filePath;
          meta.extension = ext;
          meta.skip = skip;
          meta.sheet = sheet;
          meta.encoding = encoding;
          
          const types = this.checkTypes(records);

          let columns = []
          for(let i = 0; i < header.length; i++) {
            const col = header[i];
            const metaCol = new MetaColumn();
            metaCol.originalColumnName = col;
            metaCol.columnName = col;
            metaCol.meta = meta;
            metaCol.order = i;
            metaCol.originalType = types[i];
            metaCol.type = types[i];
            columns.push(metaCol);
          }
          
          resolve({
            meta: meta, 
            columns: columns
          });
        })
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

  /**
   * 
   * @param records n x m의 csv records
   * @returns AcceptableType[]
   */
  checkTypes(records:string[][]):AcceptableType[] {
    const types = []
    for(let i = 1; i < records.length; i++) {
      if(i === 1) {
        for(let record of records[i]) {
          types.push(this.availableType(record))
        }
        continue;
      }

      for(let j = 0; j < records[i].length; j++) {
        //type이 varchar인 경우 Type을 확인하지 않고 다음 loop로 진행
        if(types[j] === AcceptableType.VARCHAR) continue;

        //기존 Type과 새로 판별한 Type이 다른 경우 Varchar로 변경
        const availableType = this.availableType(records[i][j]);
        if(availableType !== types[j]) types[j] = AcceptableType.VARCHAR;
      }

      //전체 타입이 varchar로 유츄되는 경우 더이상 Type을 확인하지 않고 break;
      if(types.every( type => type === AcceptableType.VARCHAR)) break;
    }
    return types;
  }

  /**
   * string 값을 받아 Integer, Double, Date, Varchar 타입을 유추하는 함수
   * @param string Csv 셀 내부의 value
   * @returns AcceptableType
   */
  availableType(string) {
    try {
      const tempNumn = Number(string);
      if(!isNaN(tempNumn)) {
        /**
         * 숫자 타입인 경우 INTEGER와 DOUBLE 중 선택
         */
        return this.isInt(tempNumn) ? AcceptableType.INTEGER : AcceptableType.DOUBLE
      }

      if(moment(string).isValid()) {
        return AcceptableType.DATE;
      }

      return AcceptableType.VARCHAR;
    } catch (err) {
      return AcceptableType.VARCHAR;
    }
  }

  /**
   * 파라메터로 넘어온 Number 값이 정수인지 판별
   * @param n 
   * @returns boolean
   */
  isInt(n) {
    return n % 1 === 0;
  }
}

export default CsvMetaLoadStrategy;