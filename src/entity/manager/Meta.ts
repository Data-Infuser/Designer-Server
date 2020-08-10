import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { User } from "./User";
import { MetaColumn } from "./MetaColumn";
import { Service } from "./Service";
import { AcceptableDbms } from "./DatabaseConnection";



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

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @OneToOne(type => Service, service => service.meta) // specify inverse side as a second parameter
  service: Service;

  @OneToMany(type => MetaColumn, mc => mc.meta)
  columns: MetaColumn[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
