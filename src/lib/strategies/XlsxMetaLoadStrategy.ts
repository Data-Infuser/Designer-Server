import MetaLoadStrategy from "../MetaLoadStrategy";
import { Meta } from "../../entity/manager/Meta";
import { AcceptableType, MetaColumn } from "../../entity/manager/MetaColumn";
import MetaLoaderFileParam from "../interfaces/MetaLoaderFileParam";

// const Excel = require("exceljs");
import * as Excel from 'exceljs';
import moment from "moment";

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
        meta.samples = this.getSampleData(worksheet, skip);

        const { types, nullables } = this.checkTypesAndNullable(worksheet, skip);
        console.log(types)
        console.log(nullables)
        let columns = []
        for(let i = 1; i < header.length; i++) {
          const col = header[i];
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = col;
          metaCol.columnName = col;
          metaCol.meta = meta;
          metaCol.order = i;
          metaCol.isNullable = nullables[i-1]
          metaCol.type = types[i-1]
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

  /**
   * 
   * @param records n x m의 csv records
   * @returns AcceptableType[]
   */
  checkTypesAndNullable(worksheet:Excel.Worksheet, skip: number):{ types: AcceptableType[], nullables: boolean[] }{
    skip = skip + 1;
    let types
    let nullables;

    for(let i = skip; i < worksheet.rowCount; i++) {
      const records = worksheet.getRow(i).values;
      //첫번쨰 value는 빈 값
      const length = Number(records.length)-1;
      if(i === skip) {
        /** 
         * excel의 header에는 빈값이 없기 떄문에 array들을 초기화 하는데 사용
         */
        nullables = Array(length).fill(false);
        types = Array(length);
        continue;
      } else if (i === skip + 1) {
        for(let j = 1; j < length + 1; j++) {
          if(this.isNull(records[j])) continue;
          types[j-1] = this.availableType(records[j])
        }
        continue;
      }
      
      for(let j = 1; j <= length + 1; j++) {
        //nullable확인
        const data = records[j];
        if(!nullables[j-1]) {
          nullables[j-1] = this.isNull(data);
        }
        //type이 varchar인 경우 Type을 확인하지 않고 다음 loop로 진행
        if(types[j-1] === AcceptableType.VARCHAR || (nullables[j-1] === true && this.isNull(data)) ) continue;

        //기존 Type과 새로 판별한 Type이 다른 경우 Varchar로 변경
        //단 INTEGER의 경우 DOUBLE로 처리하는 것은 가능해야함
        const availableType = this.availableType(data);
        if(availableType !== types[j-1]) {
          if((availableType === AcceptableType.DOUBLE && types[j-1] === AcceptableType.INTEGER) || (availableType === AcceptableType.INTEGER && types[j-1] === AcceptableType.DOUBLE)) {
            types[j-1] = AcceptableType.DOUBLE
          } else {
            types[j-1] = AcceptableType.VARCHAR;
          }
        }
      }
      //전체 타입이 varchar로 유츄되는 경우 더이상 Type을 확인하지 않고 break;
      if(types.every( type => type === AcceptableType.VARCHAR)) break; 
    }

    return {
      types,
      nullables
    }
  }

  isNull(value) {
    if (value === null) return true 
    if (typeof value === 'undefined') return true 
    if (typeof value === 'string' && value === '') return true 
    if (Array.isArray(value) && value.length < 1) return true 
    if (typeof value === 'object' && value.constructor.name === 'String' && Object.keys(value).length < 1) return true // new String() return false
    return false;
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
      
      if(moment(string, null, true).isValid()) {
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

  /**
   * 전체 Record를 받아 최대 5개의 sampleData를 JSON String으로 return
   */
  getSampleData(worksheet, skip) {
    const sampleDatas = [];
    for(let i = 2; i < 7; i++) {
      sampleDatas.push(worksheet.getRow(skip + i).values.slice(1));
    }
    return JSON.stringify({items:sampleDatas});
  }
}

export default XlsxMetaLoadStrategy;