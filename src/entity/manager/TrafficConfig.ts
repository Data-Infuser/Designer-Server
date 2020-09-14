import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, Unique} from "typeorm";
import { Application } from "./Application";

export enum TrafficConfigType {
  // 각각의 값이 perMonth, perDay
  MONTH = "month",
  DAY = "day"
}

@Entity()
@Unique("traffic-config-unique", ["application", "type"])
export class TrafficConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Application, app => app.trafficConfigs, { nullable: false, onDelete: 'CASCADE' })
  application: Application;

  @Column()
  applicationId: number;

  @Column({
    type: "enum",
    enum: TrafficConfigType,
    default: TrafficConfigType.MONTH
  })
  type: string;

  @Column()
  maxCount: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
