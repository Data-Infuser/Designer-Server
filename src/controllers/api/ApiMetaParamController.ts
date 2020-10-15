import { Request as exRequest } from "express";
import { Body, Controller, Get, Path, Post, Put, Request, Route, Security, Tags } from "tsoa";
import { getRepository } from 'typeorm';
import { MetaParam, ParamOperatorType } from "../../entity/manager/MetaParam";
import ApplicationError from '../../ApplicationError';
import { ERROR_CODE } from "../../util/ErrorCodes";
import { Meta } from "../../entity/manager/Meta";
import { MetaParamParams } from "../../interfaces/requestParams/MetaParamParams";

@Route("/api/meta-params")
@Tags("MetaParam")
export class ApiMetaParamController extends Controller {
  @Get("/{id}")
  @Security("jwt")
  public async get(
    @Request() request: exRequest,
    @Path("id") metaId: number
  ):Promise<MetaParam>{
    const paramRepo = getRepository(MetaParam);
    const param = paramRepo.findOne({
      where: {
        id: metaId
      }
    })
    return Promise.resolve(param);
  }

  @Post("/")
  @Security("jwt")
  public async post(
    @Request() request: exRequest,
    @Body() postParam: MetaParamParams
  ) {
    const paramRepo = getRepository(MetaParam);
    const newParam = new MetaParam();
    newParam.description = postParam.description;
    newParam.isRequired = postParam.isRequired;
    newParam.operator = postParam.operator;
    newParam.metaColumnId = postParam.metaColumnId;
    try {
      await paramRepo.save(newParam);  
    } catch (err) {
      if(err.code && err.code === "ER_DUP_ENTRY") {
        throw new ApplicationError(401, ERROR_CODE.METAPARAM.META_PARAM_DUPLICATE)
      } else {
        throw err;
      }
    }
    
    return Promise.resolve(newParam);
  }

}