import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";

export enum AcceptableDbms {
  MYSQL = "mysql",
  ORACLE = "oracle",
  MARIADB = "mariadb",
  POSTGRES = "postgres",
  CUBRID = "cubrid"
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

  @Column()
  userId: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
