
import { WriteStream } from 'fs';
import { Readable } from 'typeorm/platform/PlatformTools';
export default interface FileManageStrategy {
    createWriteStream(path:string): {stream: Readable|WriteStream, path: string};
    createReadStream(path:string)
    saveFile(path:string, file: Buffer);
}