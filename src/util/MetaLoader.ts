import { getManager, createConnections, getConnection } from "typeorm";
import { SelectOptions } from "./SelectOptions";
import * as Excel from 'exceljs';
import { Meta } from "../entity/manager/Meta";
import { User } from "../entity/manager/User";
import { MetaColumn } from "../entity/manager/MetaColumn";
import { MetaInfo } from "./MetaInfo";

export class MetaLoader {
  static loadMetaFromFile = async (formData) => {
    return new Promise<MetaInfo>(async(resolve, reject) => {
      try {
        let files = formData.files;
        let { title, skip, sheet } = formData.fields;
  
        if(files == undefined) {
          reject(new Error('파일이 없습니다.'));
          return;
        }
  
        if(title == undefined || title.length == 0) {
          reject(new Error('Meta명이 없습니다.'));
          return;
        }
  
        const filePath = files['upload'][0].path;
        const originalFileName:string = files['upload'][0].originalFilename;
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

  static loadMetaFromDBMS = async (formData) => {
    return new Promise<MetaInfo>(async(resolve, reject) => {
      try {
        const title = formData.fields.title[0]
        const host = formData.fields.host[0]
        const port = formData.fields.port[0]
        const db = formData.fields.db[0]
        const user = formData.fields.user[0]
        const pwd = formData.fields.pwd[0] ? formData.fields.pwd[0] : ""
        const table = formData.fields.table[0]
        const dbms = formData.fields.dbms[0]

        console.log(formData.fields);
        const connections = await createConnections([{
          name: "connectionForMeta",
          type: "mysql",
          host: host,
          port: port,
          username: user,
          password: pwd,
          database: db
        }])

        const manager = await getManager('connectionForMeta')
        const count = await manager
        .query(
          `SELECT count(*) as count
          FROM \`${table}\`;`
          )
        const tableInfo = await manager.query(`DESCRIBE \`${table}\`;`);

        const meta = new Meta();
        meta.title = title;
        meta.rowCounts = count[0].count;
        meta.host = host;
        meta.port = port;
        meta.db = db;
        meta.dbUser = user;
        meta.pwd = pwd;
        meta.table = table;

        let columns = []
        for(let i = 0; i < tableInfo.length; i++) {
          const info = tableInfo[i]
          const metaCol = new MetaColumn();
          metaCol.originalColumnName = info.Field;
          metaCol.columnName = info.Field;
          metaCol.type = info.Type;
          metaCol.meta = meta;
          metaCol.order = i;
          columns.push(metaCol);
        }

        await getConnection('connectionForMeta').close();

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
  };
}