import {createWriteStream, createReadStream, WriteStream} from "fs";
import propertyConfigs from "../../../config/propertyConfig";
import FileManageStrategy from "../FileManageStrategy";
import { Readable } from 'typeorm/platform/PlatformTools';

export class FsStrategy implements FileManageStrategy {

    createWriteStream = (path: string): { stream: WriteStream, path: string } => {
        return {
            stream: createWriteStream(propertyConfigs.uploadDist.localPath + "/" + path),
            path: propertyConfigs.uploadDist.localPath + "/" + path
        }
    }

    createReadStream = (path: string) => {
        return createReadStream(path);
    }

    saveFile = (path:string, file: Buffer) => {
        return;
    }
}