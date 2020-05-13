import { KongService } from "./KongService";

export class KongRoute {

  static KONG_ROUTE_NAME_PREFIX = "route-";

  constructor(name: string, paths: Array<string>, 
    methods: Array<string>, protocols?: Array<string>) {
    this.name = name;
    this.paths = paths;
    this.methods = methods;
    if (protocols) this.protocols = protocols; else this.protocols = ['http', 'https'];
  }
  
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  protocols: Array<string>;
  methods: Array<string>;
  hosts: Array<string>;
  paths: Array<string>;
  headers: Object;
  https_redirect_status_code: number;
  regex_priority: number;
  strip_path: boolean;
  path_handling: string;
  preserve_host: boolean;
  tags: Array<string>;
  service: KongService;
}