import {PondUploadFile} from "../../component";
import {Channel} from "../../../pondSocket";
import {BaseClass} from "../../../pondBase";

export declare class UploadRequest {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    /**
     * @desc Declines the upload request for the file
     * @param error - The error message to send to the client
     */
    declineUpload(error?: string): void;

    /**
     * @desc Accepts the upload request for the file
     */
    acceptUpload(): void;
}

export declare class UploadAuthoriseMessage extends BaseClass {

    get files(): UploadRequest[];

    /**
     * @desc Accepts the upload request for all files in the message
     */
    authoriseAll(): void;

    /**
     * @desc Declines the upload request for all files in the message
     * @param message - The message to send to the client
     */
    sendError(message?: string): void;
}
