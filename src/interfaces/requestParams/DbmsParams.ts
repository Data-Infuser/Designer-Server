import { AcceptableDbms } from "../../entity/manager/DatabaseConnection";

export default interface DbmsParams {
  stageId: number,
  title: string,
  dbms: AcceptableDbms,
  host: string,
  port: string,
  database: string,
  user: string,
  password:string,
  table: string
}