/// <reference types="node" />
import {MiddleWareFunction, NextFunction} from "../helpers/chainLambda";
import {IncomingMessage, ServerResponse} from "http";
import {Authorizer} from "../helpers/authenticate";
import {ValidateUpload} from "./authoriseUploads";
import {UploadBusboyEvent} from "./busboy";
import {Broadcast} from "../../../pondbase";

export interface FileUpload {
    name: string;
    tempPath: string;
    size: number;
    mimetype: string;
    filePath: string;
}

interface PondLiveUploadProps {
    broadcaster: Broadcast<UploadBusboyEvent, void>;
    authorizer: Authorizer;
}

export declare type UploadPondLiveRequest = (req: IncomingMessage, res: ServerResponse, next: NextFunction, validator: ValidateUpload, broadcaster: Broadcast<UploadBusboyEvent, void>) => void;
/**
 * @desc Creates a new upload middleware and wraps it around the existing middleware function
 * @param pondLiveMiddleware - the pond live middleware
 * @param props - the props to be used by the middleware
 */
export declare const generatePondLiveUploader: (pondLiveMiddleware: MiddleWareFunction, props: PondLiveUploadProps) => MiddleWareFunction;
export {};
