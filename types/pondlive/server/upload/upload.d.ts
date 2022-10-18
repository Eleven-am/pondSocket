import {ValidateUpload} from "./authoriseUploads";
import {UploadBusboyEvent} from "./busboy";
import {Broadcast} from "../../../pondbase";
import {NextFunction, Request, Response} from "express";

export interface FileUpload {
    name: string;
    tempPath: string;
    size: number;
    mimetype: string;
    filePath: string;
}

export declare type UploadPondLiveRequest = (validator: ValidateUpload, broadcaster: Broadcast<UploadBusboyEvent, void>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * @desc A middleware function that handles file uploads
 * @param validator - a function that validates the request
 * @param broadcaster - a broadcaster that broadcasts the upload events
 * @returns a middleware function
 */
export declare const GenerateUploader: UploadPondLiveRequest;
