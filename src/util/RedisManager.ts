import redis from 'redis';
import { InfuserUser } from '../controllers/api/AuthController';

const properties = require("../../property.json");

class RedisManager {
  private static _instance: RedisManager;
  
  client: redis.RedisClient;

  constructor() {}
  public static get Instance(): RedisManager {
    if(!this._instance) { this._instance = new RedisManager() }
    return this._instance;
  }


  async connect() {
    this.client = await this.createClient();
  }

  private async createClient():Promise<redis.RedisClient> {
    return new Promise((resolve, reject) => {
      const client = redis.createClient({
        host: properties.redis.host,
        port: properties.redis.port
      })

      client.on("connect", () => {
        resolve(client);
      })

      client.on("error", (err) => {
        console.error(err);
        reject(err);
      })
    })
  }

  get isConnected() {
    if(this.client) {
      return this.client.connected 
    }
    return false
  }

  private async set(key: string, value: string) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, ((err, reply) => {
        if(err) reject(err);
        resolve();
      }));
    })
  }

  private async expire(key: string, expiredIn: number) {
    return new Promise((resolve, reject) => {
      this.client.expire(key, expiredIn, ((err, reply) => {
        if(err) reject(err);
        resolve();
      }));
    })
  }

  private async get(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.get(key, ((err, reply) => {
        if(err) reject(err);
        resolve(reply);
      }));
    })
  }

  async setUserToken(infuserUser: InfuserUser) {
    await this.set(infuserUser.token, JSON.stringify(infuserUser));
    await this.expire(infuserUser.token, infuserUser.expireAt - Math.floor(Date.now() / 1000));
    return Promise.resolve();
  }

  async getUser(token) {
    const stringifyJson = await this.get(token);
    const user = JSON.parse(stringifyJson);
    return Promise.resolve(user);
  }
}

export default RedisManager;