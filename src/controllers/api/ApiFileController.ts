import { Route, Tags, Request, Post, Security } from "tsoa";
import { Request as exRequest, Response, NextFunction, response, Router } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import FileManager from '../../lib/file-manager/FileManager';

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
    let filePath;
    switch(FileManager.Instance.type) {
      case 's3':
        filePath = request.file.key;
        break;
      case 'local':
        filePath = request.file.path;
        break;
      default:
        filePath = null;
    }
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
    const filePath = FileManager.Instance.getLocalPath();
    var storage
    switch(FileManager.Instance.type) {
      case 's3':
        storage = multerS3({
          s3: FileManager.Instance.getS3Object(),
          bucket: FileManager.Instance.getBucket(),
          metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
          },
          key: function (req, file, cb) {
            const originalFileName:string = file.originalname;
            const originalFileNameTokens = originalFileName.split(".");
            const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
            cb(null, "u-"+req.user.id + "-" + Date.now() + "." + ext)
          }
        })
        break;
      case 'local':
        storage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, filePath)
          },
          filename: function (req, file, cb) {
            const originalFileName:string = file.originalname;
            const originalFileNameTokens = originalFileName.split(".");
            const ext = originalFileNameTokens[originalFileNameTokens.length - 1]
            cb(null, "u-"+req.user.id + "-" + Date.now() + "." + ext)
          }
        })
        break;
      default:
        throw Error('Error on FileManager')
    }
    
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