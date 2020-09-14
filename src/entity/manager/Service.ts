import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Table, Db} from "typeorm";
import { Length, NotContains } from "class-validator";
import { Meta } from "./Meta";
import { ServiceColumn } from "./ServiceColumn";
import { Application } from "./Application";
import { Stage } from "./Stage";
import { servicesVersion } from "typescript";

export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete"
}

export enum ServiceStatus {
  // 설정중, 데이터 스케줄링 등록, 데이터 로드 완료, 배포
  DEFAULT = "default",
  METASCHEDULED = "meta-scheduled",
  METADOWNLOADED = "meta-downloded",
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

  @Column({
    type: "enum",
    enum: ServiceStatus,
    default: ServiceStatus.DEFAULT
  })
  status: string;

  @Column()
  userId: number;

  @ManyToOne(type => Application, app => app.services, { nullable: false, onDelete: 'CASCADE' })
  application: Application;

  @ManyToOne(type => Stage, stage => stage.services, { nullable: true, onDelete: 'SET NULL' })
  stage: Stage;

  @Column({nullable: true})
  stageId: number;

  @OneToOne(type => Meta, meta => meta.service, {nullable: true})
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
}
