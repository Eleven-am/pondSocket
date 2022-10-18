/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, Server } from "http";
import internal from "stream";
export declare type NextFunction = () => void;
declare type SocketMiddlewareFunction = (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void;
export declare class SocketMiddleWare {
    private readonly _server;
    private readonly middleware;
    constructor(server: Server);
    use(middleware: SocketMiddlewareFunction): void;
    private _execute;
    private _initMiddleware;
}
export {};
