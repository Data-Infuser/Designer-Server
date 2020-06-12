import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import { User } from "./User";

export enum AcceptableDbms {
  MYSQL = "mysql",
  ORACLE = "oracle",
  MARIADB = "mariadb",
  POSTGRES = "postgres"
}


@Entity()
export class DatabaseConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(1, 100)
  connectionName: string;

  @Column()
  hostname: string;

  @Column()
  port: string;

  @Column()
  database: string;

  @Column()
  username: string;

  @Column({default: ""})
  password: string;

  @Column({
    type: "enum",
    enum: AcceptableDbms,
    default: AcceptableDbms.MYSQL
  })
  dbms: AcceptableDbms;

  @ManyToOne(type => User, user => user.metas, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  // toJSON() {
  //   const json = Object.assign({}, this);
  //   delete json.id;
  //   delete json.connectionName;
  //   delete json.createdAt;
  //   delete json.updatedAt;
  //   delete json.user;
  //   return json;
  // }
}
