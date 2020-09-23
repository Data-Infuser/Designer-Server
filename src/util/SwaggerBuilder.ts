import { getRepository } from "typeorm";
import _ from "lodash";
import { Service } from "../entity/manager/Service";
import { Application } from "../entity/manager/Application";
import { Stage } from "../entity/manager/Stage";
import { Meta } from "../entity/manager/Meta";
import { MetaColumn } from "../entity/manager/MetaColumn";

const ApiResponseTemplate = require("./swagger_template/api_response.json");
const PathTemplate = require("./swagger_template/path_template.json");
const property = require("../../property.json");


export class SwaggerBuilder {

  static buildApplicationDoc = async (stage:Stage) => {
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

        stage.metas.forEach((meta) => {
          const service = meta.service;
          let def = SwaggerBuilder.buildDef(meta);
          let modelTemplate = _.cloneDeep(ApiResponseTemplate);
          modelTemplate.properties.datas.items['$ref'] = `#/definitions/${service.entityName}_model`;
          doc.definitions[service.entityName+'_model'] = def;
          doc.definitions[service.entityName+'_api'] = modelTemplate;
          doc.paths[`/api/${stage.application.nameSpace}/v${stage.name}/${service.entityName}`] = SwaggerBuilder.buildPath(meta);
        });
        resolve(doc);
      } catch(err) {
        console.log(err);
        reject();
      }
    });
  }

  static buildDoc = async (services?:Service[]) => {
    return new Promise<any>(async(resolve, reject) => {
      const serviceRepo = getRepository(Service);
      let doc = {
        "swagger": "2.0",
        "info": {
          "version": property.app.version,
          "title": property.app.title,
          "description": property.app.description
        },
        "host": property.host.replace(/https?(:\/\/)/gi, ""),
        "schemes": ["http"],
        "paths": {},
        "definitions": {}
      };

      try {
        if(!services) {
          services = await serviceRepo.find({
            relations: ["meta", "columns"],
          });
        }

        // services.forEach((service) => {
        //   let def = SwaggerBuilder.buildDef(service);
        //   let modelTemplate = _.cloneDeep(ApiResponseTemplate);
        //   modelTemplate.properties.datas.items['$ref'] = `#/definitions/${service.tableName}_model`;

        //   doc.definitions[service.tableName+'_model'] = def;
        //   doc.definitions[service.tableName+'_api'] = modelTemplate;

        //   doc.paths[`/api/dataset/${service.tableName}`] = SwaggerBuilder.buildPath(service);
        // });
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
        "type": col.type
      }
    });

    return def;
  }

  private static buildPath = (meta: Meta) => {
    let pathTemplate = _.cloneDeep(PathTemplate);

    pathTemplate["get"].tags.push(meta.service.entityName);
    pathTemplate["get"].description = meta.service.description;
    // pathTemplate["get"].responses[200].schema["$ref"] = `#/definitions/${service.tableName}_api`;
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
}