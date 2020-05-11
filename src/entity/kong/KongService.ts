
export class KongService {

  constructor(name?: string, host?: string, port?: number, path?: string) {
    if (name) this.name = name
    if (host) this.host = host
    if (port) this.port = port
    if (path) this.path = path
  }
  
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  retries: number;
  protocol: string;
  host: string;
  port: number;
  path: string;
  connect_timeout: number;
  write_timeout: number;
  read_timeout: number;
  tags: Array<string>;
}