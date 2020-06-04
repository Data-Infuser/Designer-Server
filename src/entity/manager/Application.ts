import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, BaseEntity, Unique} from "typeorm";
import { Length, IsNotEmpty, NotContains } from "class-validator";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";
import { Api, ServiceStatus } from "./Api";

export enum ApplicationStatus {
  // 설정중, 데이터 스케줄링 등록, 데이터 로드 완료, 배포
  IDLE = "idle",
  SCHEDULED = "scheduled",
  LOADED = "loaded",
  FAILED = "failed" ,
  DEPLOYED = "deployed"
}

@Entity()
@Unique("application_namespace_unique", ["nameSpace"])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  @NotContains("-")
  nameSpace: string;

  @Column()
  @Length(1, 100)
  title: string;

  @Column({type: "text"})
  description: string;

  @Column({
    type: "enum",
    enum: ApplicationStatus,
    default: ApplicationStatus.IDLE
  })
  status: string;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @OneToMany(type => Api, api => api.application)
  apis: Api[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  get isDeployable(): boolean {
    if(this.apis.length == 0) return false;
    this.apis.forEach(api => {
      if(api.status == ServiceStatus.METALOADED) return false
    });
    return true; 
  }

  get isDeployed():boolean {
    return this.status == ApplicationStatus.DEPLOYED ? true : false
  }
}
