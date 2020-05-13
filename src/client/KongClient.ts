import * as rm from "typed-rest-client/RestClient";
import property from "../../property.json";
import { Api } from "../entity/manager/Api";
import { KongService } from "../entity/kong/KongService";
import { KongRoute } from "../entity/kong/KongRoute";
import { KongPlugin } from "../entity/kong/KongPlugin";

export class KongClient {
  URI_KONG_SERVICE = "/services/";
  URI_KONG_PLUGIN = "/plugins/";
  URI_KONG_ROUTE = "/routes/";

  constructor() {
    this.kongUrl = property.kongUrl;
    this.restClient = new rm.RestClient('rest-sample', property.kongUrl);
  }

  restClient: rm.RestClient;
  kongUrl: string;
  
  /**
   * service 및 route 일괄 생성
   */
  init = async() => {
    const serviceName = "dataset-service";

    if(await this.retrieveService(serviceName)) {
      console.log('kong service already exists');
      return;
    }
    
    console.log('there is no kong service. initializing kong service');
    let kongService: KongService = new KongService(serviceName, `${property.apiServerUrl}${Api.API_URL_PREFIX}`);
    kongService = await this.addService(kongService);

    // TODO: route 경로 설정시, api version 에 따른 route 처리 필요.
    let kongRoute: KongRoute = new KongRoute("dataset-route", 
                                              ['/api/v1/dataset'], ['GET']);
    kongRoute = await this.addRoute(kongService.name, kongRoute);
    
    const authPlugin = await this.addKeyAuthPlugin(kongRoute.id);

  }

  retrieveService = async(serviceName: string) => {
    const path = this.URI_KONG_SERVICE + serviceName;
    const response: rm.IRestResponse<KongService> = await this.restClient.get<KongService>(path);
    console.log('kong retrieve service')
    console.log(response);
    return response.result;
  }

  addService = async(kongService: KongService) => {
    let response: rm.IRestResponse<KongService> = await this.restClient.create<KongService>(this.URI_KONG_SERVICE, kongService);
    console.log('kong add service response-----');
    console.log(response.result);
    return response.result;
  }

  addRoute = async(serviceName: string, kongRoute: KongRoute) => {
    const path = this.URI_KONG_SERVICE + serviceName + this.URI_KONG_ROUTE;
    let response: rm.IRestResponse<KongRoute> = await this.restClient.create<KongRoute>(path, kongRoute);
    console.log('kong add route response-----');
    console.log(response.result);
    return response.result;
  }

  addKeyAuthPlugin = async(routeId: string) => {
    const path = this.URI_KONG_ROUTE + routeId + this.URI_KONG_PLUGIN;
    const kongPlugin: KongPlugin = new KongPlugin(KongPlugin.PLUGIN_NAME_KEY_AUTH);
    let response: rm.IRestResponse<KongRoute> = await this.restClient.create<KongRoute>(path, kongPlugin);
    console.log('kong add keyAuthPlugin response-----');
    console.log(response.result);
  }
}