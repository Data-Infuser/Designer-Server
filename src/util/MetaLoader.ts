import { getManager, createConnections, getConnection } from "typeorm";
import * as Excel from 'exceljs';
import { Meta } from "../entity/manager/Meta";
import { User } from "../entity/manager/User";
import { MetaColumn, AcceptableType } from "../entity/manager/MetaColumn";
import mysqlTypes from "./dbms_data_types/mysql.json";
import { MetaInfo } from "../interfaces/MetaInfo";

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
        console.log('MetaLoader');
        console.log(formData);
        

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

        await createConnections([{
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
        meta.dataType = 'dbms';
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
          const convertedType = convertType(info.Type);
          metaCol.type = convertedType.type;
          if(convertedType.size) metaCol.size = convertedType.size;
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

function convertType(originType: string){
  const lowercaseType:string = originType.toLowerCase()
  const tokens = lowercaseType.split("(");
  let type = mysqlTypes[tokens[0]]
  let size:number;

  if(tokens[1]) {
    let candidateSize = Number(tokens[1].split(")")[0]);
    if(!isNaN(candidateSize)) size = candidateSize;
  }
  
  if(!type) type = "varchar"

  return {
    type: type,
    size: size
  }
}

