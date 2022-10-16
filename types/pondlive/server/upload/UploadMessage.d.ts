import {FileUpload} from "./upload";

export interface IncomingUploadMessage {
    files: PondFile[];
}

export declare class PondFile {
    name: string;
    size: number;
    mimetype: string;

    destroy(): Promise<void>;

    move(directory: string): Promise<void>;
}

export declare class UploadMessage implements IncomingUploadMessage {
    constructor(files: FileUpload[]);

    get files(): PondFile[];
}
