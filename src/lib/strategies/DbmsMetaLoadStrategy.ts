import MetaLoadStrategy from '../MetaLoadStrategy';
import MetaLoaderDbConnection from '../interfaces/MetaLoaderDbConnection';

export default interface DbmsMetaLoadStrategy extends MetaLoadStrategy{
  showTables(info:MetaLoaderDbConnection);
  descTable(info:MetaLoaderDbConnection);
}