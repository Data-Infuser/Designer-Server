import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { MetaColumn } from "./MetaColumn";
import { Service } from "./Service";
import { AcceptableDbms } from "./DatabaseConnection";
import { Stage } from "./Stage";

export enum MetaStatus {
  // 설정중, 데이터 스케줄링 등록, 데이터 로드 완료, 배포
  DEFAULT = "default",
  DOWNLOAD_SCHEDULED = "download-scheduled",
  DOWNLOAD_DONE = "download-done",
  METALOADED = "meta-loaded",
  DATA_LOAD_SCHEDULED = "data_load_scheduled",
  DATA_LOADED = "loaded",
  FAILED = "failed" 
}

@Entity()
export class Meta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: MetaStatus,
    default: MetaStatus.DEFAULT
  })
  status: string;

  @Column({type: "text"})
  samples: string = JSON.stringify({items:[]});

  @Column()
  @Length(1, 100)
  title: string;

  @Column({default: 'file'})
  dataType: string;

  @Column({nullable: true})
  @Length(1, 100)
  originalFileName: string;

  @Column({nullable: true})
  remoteFilePath: string;

  @Column({nullable: true})
  filePath: string;

  @Column({nullable: true})
  encoding: string;

  @Column({nullable: true})
  @Length(1, 20)
  extension: string;

  @Column({nullable: true})
  host: string;

  @Column({nullable: true})
  port: string;

  @Column({nullable: true})
  db: string;

  @Column({nullable: true})
  dbUser: string;

  @Column({nullable: true})
  pwd: string;

  @Column({nullable: true})
  table: string;

  @Column({
    type: "enum",
    enum: AcceptableDbms,
    default: AcceptableDbms.MYSQL
  })
  dbms: AcceptableDbms;

  @Column({ default: 0 })
  rowCounts: number;

  @Column({ default: 0 })
  skip: number;

  @Column({ default: 0 })
  sheet: number;

  @Column()
  userId: number;

  @OneToOne(type => Service, service => service.meta) // specify inverse side as a second parameter
  service: Service;

  @ManyToOne(type => Stage, stage => stage.metas, { nullable: false, onDelete: 'CASCADE' })
  stage: Stage;

  @Column()
  stageId: number;

  @OneToMany(type => MetaColumn, mc => mc.meta)
  columns: MetaColumn[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
