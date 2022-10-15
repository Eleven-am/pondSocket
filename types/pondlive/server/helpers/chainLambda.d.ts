/// <reference types="node" />
import {IncomingMessage, ServerResponse} from "http";
import {PondRequest} from "./pondRequest";
import {PondResponse} from "./pondResponse";

export declare type NextFunction = () => void;
export declare type MiddleWareFunction = (request: IncomingMessage, response: ServerResponse, next: NextFunction) => void;
export declare type PondMiddleware = (request: PondRequest, response: PondResponse, next: NextFunction) => void;
export declare const MiddlewareHandler: () => PondChainHandler;
export declare type Chain = {
    use: (middleware: MiddleWareFunction) => void;
};
export declare type PondChain = {
    use: (middleware: PondMiddleware) => void;
};
export declare type PondChainHandler = {
    use: (middleware: PondMiddleware) => void;
    chain: () => MiddleWareFunction;
};
