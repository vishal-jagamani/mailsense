import { Readable } from 'stream';

export interface ObjectStream {
    stream: Readable;
    contentLength?: number;
}
