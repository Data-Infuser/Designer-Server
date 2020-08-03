import {Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn} from "typeorm";
import { Application } from "./Application";

/**
 * @tsoaModel
 */
@Entity()
export class LoaderLog {

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(type => Application)
  @JoinColumn()
  application: Application;

  @Column({type: "text"})
  content: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
