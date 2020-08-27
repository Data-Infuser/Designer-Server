import { Route, Tags, Request, Post, Security } from "tsoa";
import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import multer from "multer";
import ApplicationError from "../../ApplicationError";

const property = require("../../../property.json")

@Route("/api/files")
@Tags("File")
export class ApiFileController {
  /**
   * File upload의 경우 api doc 생성을 위해서는 tsoa.json에 param 설정을 해야함.
   *  body param 정보는 tsoa.json을 참고해주세요.
   * @param request 
   */
  @Post("/")
  @Security("jwt")
  public async postFile(
    @Request() request: exRequest
  ): Promise<any> {
    await this.handleFile(request);
    const filePath = request.file.path;
    const originalFileName:string = request.file.originalname;
    const originalFileNameTokens = originalFileName.split(".");
    const ext = originalFileNameTokens[originalFileNameTokens.length - 1]

    return Promise.resolve({
      filePath,
      originalFileName,
      ext
    })
  };

  private handleFile(request: exRequest): Promise<any> {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, property["upload-dist"].localPath)
      },
      filename: function (req, file, cb) {
        const originalFileName:string = file.originalname;
        const originalFileNameTokens = originalFileName.split(".");
        const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
        cb(null, req.user.id + "-" + Date.now() + "." + ext)
      }
    })
    const multerSingle = multer({ storage }).single("file");
    return new Promise((resolve, reject) => {
      multerSingle(request, undefined, async (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }
}

export default ApiFileController;