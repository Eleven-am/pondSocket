/// <reference types="node" />
import { MiddleWareFunction } from "../middleWare";
import { IncomingMessage } from "http";
export declare type BodyParserRequest = IncomingMessage & {
    body?: any;
};
export declare function BodyParserMiddleware(): MiddleWareFunction;
export declare function JsonBodyParserMiddleware(): MiddleWareFunction;