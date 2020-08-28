import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, OneToMany, OneToOne, BaseEntity, Unique} from "typeorm";
import { Length, IsNotEmpty, NotContains } from "class-validator";
import { Service, ServiceStatus } from "./Service";
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

  @OneToMany(type => Service, service => service.application)
  services: Service[];

  @OneToMany(type => TrafficConfig, trafficConfig => trafficConfig.application)
  trafficConfigs: TrafficConfig[];

  @OneToMany(type => Stage, stage => stage.application)
  stages: Stage[];

  @Column()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  createStage(name) {
    if(!this.services || this.services.length === 0) throw new Error("Service가 존재하지 않습니다.");
    console.log(this.services);
    const newStage = new Stage();
    newStage.name = name;
    newStage.application = this;
    newStage.status = StageStatus.SCHEDULED;
    newStage.services = this.services.filter(el => el.stage === null || el.stage === undefined);
    newStage.services.forEach(element => {
      element.status = ServiceStatus.SCHEDULED;
    });
    return newStage;
  }
}
