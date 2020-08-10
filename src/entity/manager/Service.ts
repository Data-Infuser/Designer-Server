import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Table, Db} from "typeorm";
import { Length, NotContains } from "class-validator";
import { User } from "./User";
import { Meta } from "./Meta";
import { ServiceColumn } from "./ServiceColumn";
import { Application } from "./Application";


export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete"
}

export enum ServiceStatus {
  // 설정중, 데이터 스케줄링 등록, 데이터 로드 완료, 배포
  IDLE = "idle",
  LOADSCHDULED = "load-scheduled",
  METALOADED = "meta-loaded",
  SCHEDULED = "scheduled",
  LOADED = "loaded",
  FAILED = "failed" 
}
@Entity()
export class Service {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({default: "타이틀이 입력되지 않았습니다."})
  @Length(1, 100)
  title: string;

  @Column({
    type: "enum",
    enum: HttpMethod,
    default: HttpMethod.GET
  })
  method: string;

  @Column({type: "text"})
  description: string;

  @Column()
  @Length(1, 100)
  @NotContains("-")
  entityName: string; //TODO: 생성시 unique 처리 필요.

  @Column({nullable: true})
  @Length(1, 100)
  tableName: string;

  @Column({nullable: true})
  columnLength: number;

  @Column({nullable: true})
  dataCounts: number;

  @Column({
    type: "enum",
    enum: ServiceStatus,
    default: ServiceStatus.IDLE
  })
  status: string;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(type => Application, app => app.services, { nullable: true, onDelete: 'CASCADE' })
  application: Application;

  @OneToOne(type => Meta, {nullable: true, onDelete: "SET NULL"})
  @JoinColumn()
  meta: Meta;

  @OneToMany(type => ServiceColumn, sc => sc.service, {nullable: true})
  columns: ServiceColumn[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  get endpoint(): string {
    return `/${this.entityName}`;
  }

  get fullUrl(): string {
    return `/api/${this.application.nameSpace}/${this.entityName}`
  }

  get statusString(): string {
    switch(this.status) {
      case ServiceStatus.IDLE:
        return "메타 설정 필요"
      case ServiceStatus.METALOADED:
        return "메타 설정 완료"
      case ServiceStatus.SCHEDULED:
        return "스케쥴 등록 완료"
      case ServiceStatus.LOADED:
        return "데이터 적재 완료"
      case ServiceStatus.FAILED:
        return "데이터 적재 실패"
      default:
        return "-"
    }
  }
}
