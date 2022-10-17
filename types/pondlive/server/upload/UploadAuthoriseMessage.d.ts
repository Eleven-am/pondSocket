import {BaseClass} from "../../../pondbase";

export declare class UploadRequest {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    /**
     * @desc Declines the upload request for the file.
     * @param reason - The reason for declining the upload.
     */
    declineUpload: (reason?: string) => void;

    /**
     * @desc Accepts the upload request for the file.
     */
    acceptUpload: () => void;
}

export declare class UploadAuthoriseMessage extends BaseClass {
    /**
     * @desc Gets all the files that are being uploaded
     */
    get files(): UploadRequest[];

    /**
     * @desc Accepts the upload for all the files
     */
    authoriseAll(): void;

    /**
     * @desc Declines the upload for all the files
     * @param message - The message to send to the client
     */
    sendError(message?: string): void;
}
