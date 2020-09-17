import { getRepository, ObjectType, Connection } from 'typeorm';
import { FindManyOptions } from 'typeorm';

export default class Pagination<T> {
  // private
  private type: ObjectType<T>;
  //public
  items: T[] = [];
  page: number = 1;
  perPage: number = 10;
  totalCount: number;
  
  constructor(type: ObjectType<T>, connection: Connection) {
    this.type = type;
  }

  async findBySearchParams(relations, page, perPage, userId?) {
    const repo = getRepository(this.type);

    if(page) this.page = page;
    if(perPage) this.perPage = perPage;

    const findOption: FindManyOptions = {
      take: this.perPage,
      skip: (this.page - 1) * this.perPage
    }

    if(userId) {
      findOption.where = {
        userId: userId
      }
    }

    if(relations && relations.length > 0) {
      findOption.relations = relations
    }

    const result = await repo.findAndCount(findOption);
    this.items = result[0];
    this.totalCount = result[1];
  }
}