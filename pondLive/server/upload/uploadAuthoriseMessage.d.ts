import { PondUploadFile } from "../../component";
import { Channel } from "../../../pondSocket";
import { BaseClass } from "../../../pondBase";
export declare class UploadRequest {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    declineUpload: (error?: string) => void;
    acceptUpload: () => void;
}
export declare class UploadAuthoriseMessage extends BaseClass {
    private readonly _files;
    private readonly _identifier;
    private readonly clientId;
    private readonly _channel;
    private readonly _uploadPath;
    constructor(files: PondUploadFile[], identifier: string, clientId: string, uploadPath: string, channel: Channel);
    get files(): UploadRequest[];
    /**
     * @desc Creates a socket response object.
     */
    private _createPondResponse;
    authoriseAll(): void;
    sendError(message?: string): void;
    private _authorizeDownload;
    private _declineDownload;
}
