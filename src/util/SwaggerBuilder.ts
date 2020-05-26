import { getRepository } from "typeorm";
import _ from "lodash";

import { Api } from "../entity/manager/Api";
import { ApiColumn } from "../entity/manager/ApiColumns";

import Config from "../../property.json"
import ApiResponseTemplate from "./swagger_template/api_response.json";
import PathTemplate from "./swagger_template/path_template.json";


export class SwaggerBuilder {

  static buildDoc = async (apis?:Api[]) => {
    return new Promise<any>(async(resolve, reject) => {
      const apiRepo = getRepository(Api);
      let doc = {
        "swagger": "2.0",
        "info": {
          "version": Config.app.version,
          "title": Config.app.title,
          "description": Config.app.description
        },
        "host": Config.host.replace(/https?(:\/\/)/gi, ""),
        "schemes": ["http"],
        "paths": {},
        "definitions": {}
      };

      try {
        if(!apis) {
          apis = await apiRepo.find({
            relations: ["meta", "columns"],
          });
        }

        apis.forEach((api) => {
          let def = SwaggerBuilder.buildDef(api);
          let modelTemplate = _.cloneDeep(ApiResponseTemplate);
          modelTemplate.properties.datas.items['$ref'] = `#/definitions/${api.tableName}_model`;

          doc.definitions[api.tableName+'_model'] = def;
          doc.definitions[api.tableName+'_api'] = modelTemplate;

          doc.paths[`/api/dataset/${api.tableName}`] = SwaggerBuilder.buildPath(api);
        });
        
        resolve(doc);
      } catch(err) {
        console.log(err);
        reject();
      }
    });
  }

  private static buildDef = (api: Api) => {
    let def = {
      "type": "object",
      "properties": {}
    };

    _.forEach(api.columns, (col: ApiColumn) => {
      def.properties[col.columnName] = {
        "type": "string"
      }
    });

    return def;
  }

  private static buildPath = (api: Api) => {
    let pathTemplate = _.cloneDeep(PathTemplate);

    pathTemplate["get"].tags.push(api.title);
    pathTemplate["get"].description = api.entityName;
    pathTemplate["get"].responses[200].schema["$ref"] = `#/definitions/${api.tableName}_api`;

    return pathTemplate;
  }
}