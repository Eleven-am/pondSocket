/// <reference types="node" />
import {IncomingConnection, PondResponse as SocketResponse} from "../../../pondSocket";
import {ResponsePicker} from "../../../pondBase";
import {NextFunction, Request, Response} from "express";
import {IncomingHttpHeaders} from "http";

export declare type Authorizer = (request: IncomingHttpHeaders) => {
    clientId: string | null;
    token: string | null;
    setToken?: boolean;
    clearToken?: boolean;
};

declare type IAuthenticateRequest = (secret: string, cookie: string, authorizer?: Authorizer) => (req: Request, res: Response, next: NextFunction) => void;
declare type IAuthSocketRequest = (secret: string, cookie: string, authorizer?: Authorizer) => (req: IncomingConnection, response: SocketResponse<ResponsePicker.POND>) => void;
export declare const AuthorizeRequest: IAuthenticateRequest;
export declare const AuthorizeUpgrade: IAuthSocketRequest;
export declare const getAuthorizer: (secret: string, cookie: string, authorizer?: Authorizer) => Authorizer;
export {};
