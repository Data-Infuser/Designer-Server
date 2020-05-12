import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from "typeorm";
import { Api } from "../entity/manager/Api";
import { KongService } from "../entity/kong/KongService";
import { KongClient } from "../client/KongClient";

@EventSubscriber()
export class ApiSubscriber implements EntitySubscriberInterface<Api> {

  listenTo() {
      return Api;
  }

  async afterInsert(event: InsertEvent<Api>) {
    const api = event.entity;
    console.log("api inserted, need to connect kong service")
    // kong service 생성 TEST 코드
    // let kongService: KongService = new KongService("testname", "localhost", 3000, "/apiPath");
    // await KongClient.addService(kongService);
  }



}