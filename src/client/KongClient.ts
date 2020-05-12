import * as rm from "typed-rest-client/RestClient";
import property from "../../property.json";
import { KongService } from "../entity/kong/KongService";

let KONG_SERVICE_URI = "/services";

export class KongClient {

  static addService = async(kongService: KongService) => {
    console.log('addService called');
    let rest: rm.RestClient = new rm.RestClient('rest-sample', property.kongUrl);

    let restRes: rm.IRestResponse<KongService> = await rest.create<KongService>(KONG_SERVICE_URI, kongService);
    console.log('response-----');
    console.log(restRes);
  }
}