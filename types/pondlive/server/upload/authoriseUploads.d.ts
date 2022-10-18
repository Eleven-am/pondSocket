import {Request} from "express";
import {Authorizer} from "../auth/authenticate";

export declare type ValidateUpload = (request: Request) => {
    valid: boolean;
    clientId: string;
};
export declare type AuthoriseUploader = (authorizer: Authorizer) => ValidateUpload;
/**
 * @desc A function that authorizes upload requests
 * @param authorizer - a function that authorizes the request
 */
export declare const authoriseUploader: AuthoriseUploader;
