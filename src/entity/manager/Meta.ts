import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { MetaColumn } from "./MetaColumn";
import { Service } from "./Service";
import { AcceptableDbms } from "./DatabaseConnection";
import { Stage } from "./Stage";



@Entity()
export class Meta {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ nullable: false, default: false })
  isActive: boolean;

  @Column()
  userId: number;

  @OneToOne(type => Service, service => service.meta, {nullable: true, onDelete: "SET NULL"}) // specify inverse side as a second parameter
  @JoinColumn()
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
