import {BaseClass} from "../../../pondbase";

export declare class UploadRequest {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    declineUpload: (error?: string) => void;
    acceptUpload: () => void;
}

export declare class PondFile {
    name: string;
    size: number;
    mimetype: string;
    filePath: string;

    destroy(): Promise<void>;

    move(directory: string): Promise<void>;
}

export declare class UploadAuthoriseMessage extends BaseClass {

    get files(): UploadRequest[];

    authoriseAll(): void;

    sendError(message?: string): void;
}
