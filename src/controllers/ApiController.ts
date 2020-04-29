import { Request, Response } from "express";
import * as multiparty from 'multiparty';


class ApiController {
  static uploadXlsxFile = async(req: Request, res: Response) => {
    const promisifyUpload = (req) => new Promise<any>((resolve, reject) => {
      const form = new multiparty.Form();
  
      form.parse(req, function(err, fields, files) {
          if (err) return reject(err);
  
          return resolve({
            files: files,
            fields: fields
          });
      });
    });

    const formData = await promisifyUpload(req);

    let file = formData.files
    let fields = formData.fields

    console.log(file)
    console.log(fields)

    res.redirect("/home");
  }
  
}

export default ApiController;