/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import {IncomingMessage, Server as HTTPServer} from "http";
import {WebSocketServer} from "ws";
import {BaseClass, PondPath} from "../pondBase";
import {Endpoint, EndpointHandler} from "./endpoint";
import internal from "stream";
import {NextFunction} from "./socketMiddleWare";

export declare class PondSocket extends BaseClass {
    constructor(server?: HTTPServer, socketServer?: WebSocketServer);

    /**
     * @desc Specifies the port to listen on
     * @param port - the port to listen on
     * @param callback - the callback to call when the server is listening
     */
    listen(port: number, callback: (port?: number) => void): HTTPServer;

    /**
     * @desc adds a middleware to the server
     * @param middleware - the middleware to add
     */
    useOnUpgrade(middleware: (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void): void;

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     *
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const { query } = parse(req.url || '');
     *    const { token } = query;
     *    if (!token)
     *       return res.reject("No token provided");
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    createEndpoint(path: PondPath, handler: EndpointHandler): Endpoint;
}
