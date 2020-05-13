import { KongRoute } from "./KongRoute";
import { KongService } from "./KongService";

export class KongPlugin {

  static PLUGIN_NAME_KEY_AUTH = "key-auth";

  constructor(name: string) {
    this.name = name;
  }
  
  id: string;
  name: string;
  created_at: Date;
  route: KongRoute;
  service: KongService;
  consumer: Object;
  config: Object;
  protocols: Array<string>;
  enabled: boolean;
  tags: Array<string>;
}