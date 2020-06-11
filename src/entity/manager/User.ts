import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToMany} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";
import { Meta } from "./Meta";
import { refreshTokens } from '../../util/JwtManager';


export interface UserInterface {
  id: number,
  username: string,
  createdAt: Date,
  updatedAt: Date,
  token: string,
  refreshToken: string
}
/**
 * @tsoaModel
 */
@Entity()
export class User implements UserInterface {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(4, 20)
  username: string;

  @Column()
  @Length(4, 100)
  password: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(type => Meta, meta => meta.user)
  metas: Meta[];

  token: string;
  refreshToken: string;

  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
  
}
