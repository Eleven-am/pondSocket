import { Server as HTTPServer, IncomingMessage } from 'http';
import internal from 'stream';

import { WebSocketServer, WebSocket } from 'ws';

import { Endpoint, EndpointHandler } from '../endpoint/endpoint';
import { MatchPattern, PondPath } from '../utils/matchPattern';

export type NextFunction = () => void;

export type SocketMiddlewareFunction = (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void;

export class PondSocket {
    private readonly _server: HTTPServer;

    private readonly _matcher: MatchPattern;

    private readonly _socketServer: WebSocketServer;

    private readonly _middleware: SocketMiddlewareFunction[] = [];

    constructor (server?: HTTPServer, socketServer?: WebSocketServer) {
        this._matcher = new MatchPattern();
        this._server = server ?? new HTTPServer();
        this._socketServer = socketServer ?? new WebSocketServer({ noServer: true });
        this._init();
    }

    /**
     * @desc Specifies the port to listen on
     * @param port - the port to listen on
     * @param callback - the callback to call when the server is listening
     */
    public listen (port: number, callback?: (port?: number) => void) {
        return this._server.listen(port, callback);
    }

    /**
     * @desc Closes the server
     * @param callback - the callback to call when the server is closed
     */
    public close (callback?: () => void) {
        return this._server.close(callback);
    }

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const token = req.query.token;
     *    if (!token)
     *       return res.reject("No token provided");
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    public createEndpoint (path: PondPath, handler: EndpointHandler) {
        const endpoint = new Endpoint(this._socketServer);

        this._middleware.push((req, socket, head, next) => {
            const address = req.url || '';
            const dataEndpoint = this._matcher.parseEvent(path, address);

            if (!dataEndpoint) {
                return next();
            }

            endpoint._authoriseConnection(req, socket, head, dataEndpoint, handler);
        });

        return endpoint;
    }

    /**
     * @desc Adds a middleware function to the socket server
     * @param middleware - the middleware function to add
     */
    public use (middleware: SocketMiddlewareFunction) {
        this._middleware.push(middleware);
    }

    /**
     * @desc managed the heartbeat of the socket server
     * @private
     */
    private _manageHeartbeat () {
        this._socketServer.on('connection', (socket: WebSocket & { isAlive?: boolean }) => {
            socket.on('pong', () => {
                socket.isAlive = true;
            });
        });

        const interval = setInterval(() => {
            this._socketServer.clients.forEach((socket: WebSocket & { isAlive?: boolean }) => {
                if (socket.isAlive === false) {
                    return socket.terminate();
                }

                socket.isAlive = false;
                socket.ping(() => {});
            });
        }, 30000);

        this._socketServer.on('close', () => clearInterval(interval));
    }

    /**
     * @desc executes the middleware functions
     * @param req - the request object
     * @param socket - the socket object
     * @param head - the head buffer
     * @private
     */
    private _execute (req: IncomingMessage, socket: internal.Duplex, head: Buffer) {
        const temp = this._middleware.concat();
        const next = () => {
            const middleware = temp.shift();

            if (middleware) {
                middleware(req, socket, head, next);
            } else {
                socket.write('HTTP/1.1 400 Bad Request\r\n\r');
                socket.destroy();
            }
        };

        next();
    }

    /**
     * @desc initialises the socket server
     * @private
     */
    private _init () {
        this._manageHeartbeat();

        this._server.on('error', (error) => {
            throw new Error(error.message);
        });

        this._server.on('upgrade', (req, socket, head) => {
            this._execute(req, socket, head);
        });
    }
}
