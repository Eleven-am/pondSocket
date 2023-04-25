import { Server as HTTPServer, IncomingHttpHeaders } from 'http';

import { WebSocketServer, WebSocket } from 'ws';

import { Middleware } from '../abstracts/middleware';
import { Endpoint } from '../endpoint/endpoint';
import { ConnectionResponse } from '../endpoint/response';
import { ServerActions, SystemSender, ErrorTypes } from '../enums';
import { parseAddress } from '../matcher/matcher';
// eslint-disable-next-line import/no-unresolved
import { PondPath, IncomingConnection } from '../types';

interface SocketRequest {
    id: string;
    headers: IncomingHttpHeaders;
    address: string;
}

export class PondSocket {
    readonly #server: HTTPServer;

    readonly #socketServer: WebSocketServer;

    readonly #middleware: Middleware<SocketRequest, WebSocket>;

    constructor (server?: HTTPServer, socketServer?: WebSocketServer) {
        this.#server = server ?? new HTTPServer();
        this.#socketServer = socketServer ?? new WebSocketServer({ noServer: true });
        this.#middleware = new Middleware();
        this.#init();
    }

    /**
     * @desc Specifies the port to listen on
     * @param args - the arguments to pass to the server
     */
    public listen (...args: any[]) {
        return this.#server.listen(...args);
    }

    /**
     * @desc Closes the server
     * @param callback - the callback to call when the server is closed
     */
    public close (callback?: () => void) {
        return this.#server.close(callback);
    }

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const token = req.query.token;
     *    if (!token)
     *       return res.reject('No token provided');
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    public createEndpoint<Path extends string> (path: PondPath<Path>, handler: (request: IncomingConnection<Path>, response: ConnectionResponse) => void | Promise<void>) {
        const endpoint = new Endpoint(this.#socketServer);

        this.#middleware.use((req, socket, next) => {
            const event = parseAddress(path, req.address);

            if (event) {
                const request: IncomingConnection<Path> = {
                    ...event,
                    headers: req.headers,
                    address: req.address,
                    id: req.id,
                };

                const response = new ConnectionResponse(socket, endpoint, request.id);

                return handler(request, response);
            }

            return next();
        });

        return endpoint;
    }

    /**
     * @desc managed the heartbeat of the socket server
     * @private
     */
    #manageHeartbeat () {
        this.#socketServer.on('connection', (socket: WebSocket & { isAlive?: boolean }) => {
            socket.on('pong', () => {
                socket.isAlive = true;
            });
        });

        const interval = setInterval(() => {
            this.#socketServer.clients.forEach((socket: WebSocket & { isAlive?: boolean }) => {
                if (socket.isAlive === false) {
                    return socket.terminate();
                }

                socket.isAlive = false;
                socket.ping(() => {});
            });
        }, 30000);

        this.#socketServer.on('close', () => clearInterval(interval));
    }

    /**
     * @desc initialises the socket server
     * @private
     */
    #init () {
        this.#manageHeartbeat();

        this.#server.on('error', (error) => {
            throw new Error(error.message);
        });

        this.#server.on('upgrade', (req, socket, head) => {
            const clientId = req.headers['sec-websocket-key'] as string;
            const request: SocketRequest = {
                id: clientId,
                headers: req.headers,
                address: req.url || '',
            };

            this.#socketServer.handleUpgrade(req, socket, head, (socket) => {
                this.#middleware.run(request, socket, () => {
                    const message = {
                        action: ServerActions.ERROR,
                        event: ErrorTypes.HANDLER_NOT_FOUND,
                        channelName: SystemSender.ENDPOINT,
                        payload: {
                            message: 'No endpoint found',
                            code: 404,
                        },
                    };

                    socket.send(JSON.stringify(message));
                    socket.close();
                });
            });
        });
    }
}
