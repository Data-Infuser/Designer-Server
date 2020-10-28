import { getRepository } from "typeorm";
import _ from "lodash";
import { Service } from "../entity/manager/Service";
import { Application } from "../entity/manager/Application";
import { Stage } from "../entity/manager/Stage";
import { Meta } from "../entity/manager/Meta";
import { AcceptableType, MetaColumn } from "../entity/manager/MetaColumn";

const ApiResponseTemplate = require("./swagger_template/api_response.json");
const PathTemplate = require("./swagger_template/path_template.json");
const property = require("../../property.json");

const dataTypeDict = {
  [AcceptableType.BIGINT]: 'integer',
  [AcceptableType.INTEGER]: 'integer',
  [AcceptableType.DOUBLE]: 'number',
  [AcceptableType.BIT]: 'number',
  [AcceptableType.DATE]: 'string',
  [AcceptableType.DATETIME]: 'string',
  [AcceptableType.TIME]: 'string',
  [AcceptableType.VARCHAR]: 'string',
  [AcceptableType.TEXT]: 'string',
  [AcceptableType.LONGTEXT]: 'string',
  [AcceptableType.BOOLEAN]: 'boolean'
}
export class SwaggerBuilder {

  static buildApplicationDoc = async (stage:Stage, meta?:Meta) => {
    return new Promise<any>(async(resolve, reject) => {
      let doc = {
        "swagger": "2.0",
        "info": {
          "version": stage.name,
          "title": stage.application.title,
          "description": stage.application.description
        },
        "host": property.host.replace(/https?(:\/\/)/gi, ""),
        "schemes": ["http"],
        "paths": {},
        "definitions": {}
      };

      try {
        if(!meta) {
          stage.metas.forEach((meta) => {
          
            const service = meta.service || {
              entityName: "미설정",
              description: "미설정"
            };
            let def = SwaggerBuilder.buildDef(meta);
            let modelTemplate = _.cloneDeep(ApiResponseTemplate);
            modelTemplate.properties.datas.items['$ref'] = `#/definitions/${service.entityName}_model`;
            doc.definitions[service.entityName+'_model'] = def;
            doc.definitions[service.entityName+'_api'] = modelTemplate;
            doc.paths[`/${stage.application.nameSpace}/v${stage.name}/${service.entityName}`] = SwaggerBuilder.buildPath(meta, service);
          });
        } else {
          const service = meta.service || {
            entityName: "미설정",
            description: "미설정"
          };
          let def = SwaggerBuilder.buildDef(meta);
          let modelTemplate = _.cloneDeep(ApiResponseTemplate);
          modelTemplate.properties.datas.items['$ref'] = `#/definitions/${service.entityName}_model`;
          doc.definitions[service.entityName+'_model'] = def;
          doc.definitions[service.entityName+'_api'] = modelTemplate;
          doc.paths[`/${stage.application.nameSpace}/v${stage.name}/${service.entityName}`] = SwaggerBuilder.buildPath(meta, service);
        }
        resolve(doc);
      } catch(err) {
        console.log(err);
        reject();
      }
    });
  }

  private static buildDef = (meta: Meta) => {
    let def = {
      "type": "object",
      "properties": {}
    };

    _.forEach(meta.columns, (col: MetaColumn) => {
      def.properties[col.columnName] = {
        "type": SwaggerBuilder.dbDataTypeToSwaggerDataType(col.type)
      }
    });

    return def;
  }

  private static buildPath = (meta: Meta, service) => {
    let pathTemplate = _.cloneDeep(PathTemplate);

    pathTemplate["get"].tags.push("API 목록");
    pathTemplate["get"].description = service.description;
    pathTemplate["get"].responses = {
      '200': {
        description: "성공적으로 수행 됨",
        schema: {
          "$ref":`#/definitions/${service.entityName}_api`
        }
      },
      '401': {
        description: "인증 정보가 정확 하지 않음"
      },
      '500': {
        description: "API 서버에 문제가 발생하였음"
      }
    }
    
    meta.columns.forEach((column) => {
      column.params.forEach((param) => {
        const json:any = {
          name: `cond[${column.columnName}:${param.operator}]`,
          in: "query",
          description: param.description,
          type: "string",
        }
        pathTemplate["get"].parameters.push(json)
      })
    })

    return pathTemplate;
  }
  
  static dbDataTypeToSwaggerDataType = (type: string) => {
    return dataTypeDict[type] || 'string';
  }
  
}