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
    console.log("API afterInsert called");
    const api = event.entity;
    
    let kongService: KongService = new KongService(api.title, "localhost", 3000, api.url);
    await KongClient.addService(kongService);
  }
}