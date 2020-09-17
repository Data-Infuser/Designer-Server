import {Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany} from "typeorm";
import { Application } from "./Application";
import { Service } from './Service';
import { Meta } from "./Meta";

export enum StageStatus {
  // 설정중, 데이터 스케줄링 등록, 데이터 로드 완료, 배포
  DEFAULT = "default",
  SCHEDULED = "scheduled",
  LOADED = "loaded",
  FAILED = "failed" ,
  DEPLOYED = "deployed"
}

/**
 * @tsoaModel
 */
@Entity()
export class Stage {

  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({
    type: "enum",
    enum: StageStatus,
    default: StageStatus.DEFAULT
  })
  status: string;

  @ManyToOne(type => Application)
  application: Application;

  @Column()
  applicationId: number;

  @OneToMany(type => Meta, meta => meta.stage)
  metas: Meta[];

  @Column()
  name: string;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
