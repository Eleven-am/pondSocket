/// <reference types="node" />
import {Authorizer} from "../helpers/authenticate";
import {IncomingMessage} from "http";

export declare type ValidateUpload = (request: IncomingMessage) => {
    valid: boolean;
    clientId: string;
};
export declare type AuthoriseUploader = (authorizer: Authorizer) => ValidateUpload;
/**
 * @desc A function that authorizes upload requests
 * @param authorizer - a function that authorizes the request
 */
export declare const authoriseUploader: AuthoriseUploader;
