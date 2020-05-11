import { rm } from "typed-rest-client/RestClient";
import { KongService } from "../entity/kong/KongService";

let KONG_ADMIN_BASE_URL = "http://localhost:8001";
let KONG_SERVICE_URI = "/services";

export class KongClient {

  static addService = async(kongService: KongService) => {
    console.log('addService called');
    let rest: rm.RestClient = new rm.RestClient('rest-sample', KONG_ADMIN_BASE_URL);

    let restRes: rm.IRestResponse<KongService> = await rest.create<KongService>(KONG_SERVICE_URI, kongService);
    console.log('response-----');
    console.log(restRes);

  }
}