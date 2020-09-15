import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, BaseEntity, Unique} from "typeorm";
import { Length, IsNotEmpty, NotContains } from "class-validator";
import { TrafficConfig } from "./TrafficConfig";
import { Stage, StageStatus } from './Stage';

@Entity()
@Unique("application_namespace_unique", ["nameSpace"])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  @Length(1, 100)
  @NotContains("-")
  nameSpace: string;

  @Column()
  @Length(1, 100)
  title: string;

  @Column({type: "text"})
  description: string;

  @Column()
  userId: number;

  @OneToMany(type => TrafficConfig, trafficConfig => trafficConfig.application)
  trafficConfigs: TrafficConfig[];

  @OneToMany(type => Stage, stage => stage.application)
  stages: Stage[];

  @Column({default: 1})
  private lastStageVersion: number = 0;

  @Column()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  get lastVersion() {
    this.lastStageVersion += 1;
    return this.lastStageVersion;
  }
}
