import * as fs from "fs"
import { expect } from "chai";
import MetaLoader from '../src/lib/MetaLoader';
import MetaLoadStrategy from '../src/lib/MetaLoadStrategy';
import XlsxMetaLoadStrategy from '../src/lib/strategies/XlsxMetaLoadStrategy';
import MetaLoaderFileParam from '../src/lib/interfaces/MetaLoaderFileParam';
import CsvMetaLoadStrategy from '../src/lib/strategies/CsvMetaLoadStrategy';
import { AcceptableType } from "../src/entity/manager/MetaColumn";

var path = require('path');

describe('0-File Meta Load', () => {
  it('Test file exist', (done) => {
    const filePaths = [path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'), path.resolve(__dirname, 'filesForTest/폐기물.csv')]
    filePaths.forEach(filePath => {
      const result = fs.existsSync(filePath)
      expect(result).to.equal(true);
    })
    done();
  });

  it('Load meta from xlsx', (done) => {
    const metaLoadStrategy = new XlsxMetaLoadStrategy()
    let metaLoaderFileParam:MetaLoaderFileParam = {
      ext: 'xlsx',
      filePath: path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'),
      originalFileName: '그늘막설치현황',
      sheet: 0,
      skip: 0,
      title: '그늘막 설치 현황'
    };
    

    new MetaLoader(metaLoadStrategy).loadMeta(metaLoaderFileParam).then((result) => {
      expect(result).to.satisfy( result => {
        if(result.meta.filePath === (path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx')) && result.columns.length === 18) {
          return true;
        } else {
          return false;
        }
      })
      done();
    });
    
  });

  it('Load meta from csv', (done) => {
    const metaLoadStrategy = new CsvMetaLoadStrategy()
    let metaLoaderFileParam:MetaLoaderFileParam = {
      ext: 'csv',
      filePath: path.resolve(__dirname, 'filesForTest/폐기물.csv'),
      originalFileName: '폐기물',
      sheet: 0,
      skip: 0,
      title: '폐기물'
    };
    

    new MetaLoader(metaLoadStrategy).loadMeta(metaLoaderFileParam).then((result) => {
      expect(result).to.satisfy( result => {
        if(result.meta.filePath === (path.resolve(__dirname, 'filesForTest/폐기물.csv')) && result.columns.length === 7) {
          return true;
        } else {
          return false;
        }
      })
      done();
    });
    
  });

  it('Csv type check', (done) => {
    const testRecords = [
      [ 'column', 'column' , 'column', 'column', "column", "column", "column" ],
      [ '123', 'hello' , '1992-02-13', '0.123', "1", "0.9", "1" ], //int
      [ '0', '19920213', '1992-02-13', '0.999', "0.9", "1", "0.9"], //varchar
      [ '9999999','hello.231', '1992-02-13 19:00', '1.999', "3", "3", "ㅁㄴㅇㄹ" ] //date
    ]
    const types = new CsvMetaLoadStrategy().checkTypes(testRecords, 0);
    const expectedTypes = [AcceptableType.INTEGER, AcceptableType.VARCHAR, AcceptableType.DATE, AcceptableType.DOUBLE, AcceptableType.DOUBLE, AcceptableType.DOUBLE, AcceptableType.VARCHAR]
    
    expect(types).to.eql(expectedTypes)
    done();
  })
});
