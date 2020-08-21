import {Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne} from "typeorm";
import { Application } from "./Application";
import { Stage } from "./Stage";

/**
 * @tsoaModel
 */
@Entity()
export class LoaderLog {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Stage, {onDelete:'CASCADE'})
  @JoinColumn()
  stage: Stage;

  @Column({type: "text", nullable: true})
  content: string;

  @Column({nullable: true})
  message: string;

  @Column({default: false})
  isFailed: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
