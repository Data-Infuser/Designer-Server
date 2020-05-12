import { MetaLoader } from "../src/util/MetaLoader";
import * as fs from "fs"
import { expect } from "chai";

var path = require('path');

describe('Read xlsx', () => {
  it('Test file exist', async () => {
    const filePath = path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx')
    console.log(filePath)
    const result = fs.existsSync(filePath)
    expect(result).to.equal(true);
  });

  it('Load meta from xlsx', async () => {
    let formdata = {
      files: {
        upload: [{
          path: path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'),
          originalFilename: '그늘막설치현황.xlsx'
        }]
      },
      fields: {
        title: "그늘막설치현황",
        skip: 0,
        sheet: 0
      }
    }
    const result = await MetaLoader.loadMetaFromFile(formdata)
    expect(result.columns.length).to.equal(18);
    expect(result.meta.rowCounts).to.equal(3031);
    expect(result.meta.filePath).to.equal(path.resolve(__dirname, 'filesForTest/그늘막설치현황.xlsx'));
  });
});
