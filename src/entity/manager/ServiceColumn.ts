import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, Unique} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import { Service } from "./Service";

@Entity()
@Unique("serviceColumn_columnName_unique", ["service", "columnName"])
export class ServiceColumn {

  constructor(colunmName?:string, type?:string, service?: Service) {
    if(colunmName) this.columnName = colunmName
    if(type) this.type = type
    if(service) this.service = service
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Length(4, 100)
  columnName: string;

  @Column({ default: 'varchar' })
  @Length(1, 30)
  type: string;

  @Column({ default: false })
  hidden: boolean;

  @ManyToOne(type => Service, service => service.columns, { nullable: true, onDelete: 'CASCADE' })
  service: Service;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
