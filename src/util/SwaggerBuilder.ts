import { getRepository } from "typeorm";
import _ from "lodash";

import { Service } from "../entity/manager/Service";
import { ServiceColumn } from "../entity/manager/ServiceColumn";

import Config from "../../property.json"
import ApiResponseTemplate from "./swagger_template/api_response.json";
import PathTemplate from "./swagger_template/path_template.json";
import { Application } from "../entity/manager/Application";


export class SwaggerBuilder {

  static buildApplicationDoc = async (application:Application) => {
    return new Promise<any>(async(resolve, reject) => {
      let doc = {
        "swagger": "2.0",
        "info": {
          "version": "0.0.1",
          "title": application.title,
          "description": application.description
        },
        "host": Config.host.replace(/https?(:\/\/)/gi, ""),
        "schemes": ["http"],
        "paths": {},
        "definitions": {}
      };

      try {

        application.services.forEach((api) => {
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

  static buildDoc = async (services?:Service[]) => {
    return new Promise<any>(async(resolve, reject) => {
      const serviceRepo = getRepository(Service);
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
        if(!services) {
          services = await serviceRepo.find({
            relations: ["meta", "columns"],
          });
        }

        services.forEach((service) => {
          let def = SwaggerBuilder.buildDef(service);
          let modelTemplate = _.cloneDeep(ApiResponseTemplate);
          modelTemplate.properties.datas.items['$ref'] = `#/definitions/${service.tableName}_model`;

          doc.definitions[service.tableName+'_model'] = def;
          doc.definitions[service.tableName+'_api'] = modelTemplate;

          doc.paths[`/api/dataset/${service.tableName}`] = SwaggerBuilder.buildPath(service);
        });
        resolve(doc);
      } catch(err) {
        console.log(err);
        reject();
      }
    });
  }

  private static buildDef = (service: Service) => {
    let def = {
      "type": "object",
      "properties": {}
    };

    _.forEach(service.columns, (col: ServiceColumn) => {
      def.properties[col.columnName] = {
        "type": "string"
      }
    });

    return def;
  }

  private static buildPath = (service: Service) => {
    let pathTemplate = _.cloneDeep(PathTemplate);

    pathTemplate["get"].tags.push(service.entityName);
    pathTemplate["get"].description = service.description;
    pathTemplate["get"].responses[200].schema["$ref"] = `#/definitions/${service.tableName}_api`;

    return pathTemplate;
  }
}