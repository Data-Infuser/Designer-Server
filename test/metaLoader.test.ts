import * as fs from "fs"
import { expect } from "chai";
import MetaLoader from '../src/lib/MetaLoader';
import MetaLoadStrategy from '../src/lib/MetaLoadStrategy';
import XlsxMetaLoadStrategy from '../src/lib/strategies/XlsxMetaLoadStrategy';
import MetaLoaderFileParam from '../src/lib/interfaces/MetaLoaderFileParam';
import CsvMetaLoadStrategy from '../src/lib/strategies/CsvMetaLoadStrategy';
import { AcceptableType } from "../src/entity/manager/MetaColumn";

var path = require('path');

describe('Read xlsx', () => {
  it('Test file exist', async () => {
    const filePaths = [path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'), path.resolve(__dirname, 'filesForTest/폐기물.csv')]
    filePaths.forEach(filePath => {
      const result = fs.existsSync(filePath)
      expect(result).to.equal(true);
    })
  });

  it('Load meta from xlsx', async () => {
    const metaLoadStrategy = new XlsxMetaLoadStrategy()
    let metaLoaderFileParam:MetaLoaderFileParam = {
      ext: 'xlsx',
      filePath: path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'),
      originalFileName: '그늘막설치현황',
      sheet: 0,
      skip: 0,
      title: '그늘막 설치 현황'
    };
    

    const result = await new MetaLoader(metaLoadStrategy).loadMeta(metaLoaderFileParam);
    expect(result.meta.filePath).to.equal(path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'));
    expect(result.columns.length).to.equal(18);
  });

  it('Load meta from csv', async () => {
    const metaLoadStrategy = new CsvMetaLoadStrategy()
    let metaLoaderFileParam:MetaLoaderFileParam = {
      ext: 'csv',
      filePath: path.resolve(__dirname, 'filesForTest/폐기물.csv'),
      originalFileName: '폐기물',
      sheet: 0,
      skip: 0,
      title: '폐기물'
    };
    

    const result = await new MetaLoader(metaLoadStrategy).loadMeta(metaLoaderFileParam);
    expect(result.meta.filePath).to.equal(path.resolve(__dirname, 'filesForTest/폐기물.csv'));
    expect(result.columns.length).to.equal(7);
  });

  it('Csv type check', async() => {
    const testRecords = [
      [ '123', 'hello' , '1992-02-13', '0.123' ], //int
      [ '0', '19920213', '1992,02,13', '0.999'], //varchar
      [ '9999999','hello.231', '1992-02-13 19:00', '1.999' ] //date
    ]
    const types = new CsvMetaLoadStrategy().checkTypes(testRecords);
    const expectedTypes = [AcceptableType.INTEGER, AcceptableType.VARCHAR, AcceptableType.DATE, AcceptableType.DOUBLE]
    
    for(let i = 0; i < types.length; i++) {
      expect(types[i]).to.equal(expectedTypes[i]);
    }
  })
});
