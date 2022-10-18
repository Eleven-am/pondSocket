/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import {IncomingMessage} from "http";
import internal from "stream";

export declare type NextFunction = () => void;
declare type SocketMiddlewareFunction = (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void;

export declare class SocketMiddleWare {

    use(middleware: SocketMiddlewareFunction): void;
}

export {};
