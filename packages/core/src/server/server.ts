import { Server as HTTPServer, IncomingHttpHeaders, IncomingMessage } from 'http';
import internal from 'node:stream';

import { IncomingConnection, PondPath, uuid } from '@eleven-am/pondsocket-common';
import { WebSocketServer, WebSocket } from 'ws';

import { Middleware } from '../abstracts/middleware';
import {
    SocketRequest,
    PondSocketOptions,
    ConnectionHandler,
    ConnectionParams,
    ConnectionResponseOptions,
} from '../abstracts/types';
import { ConnectionContext } from '../contexts/connectionContext';
import { EndpointEngine } from '../engines/endpointEngine';
import { parseAddress } from '../matcher/matcher';
import { Endpoint } from '../wrappers/endpoint';

export class PondSocket {
    readonly #exclusiveServer: boolean;

    readonly #server: HTTPServer;

    readonly #socketServer: WebSocketServer;

    readonly #middleware: Middleware<SocketRequest, ConnectionParams>;

    constructor ({
        server,
        socketServer,
        exclusiveServer = true,
    }: PondSocketOptions = {}) {
        this.#middleware = new Middleware();
        this.#exclusiveServer = exclusiveServer;
        this.#server = server ?? new HTTPServer();
        this.#socketServer = socketServer ?? new WebSocketServer({ noServer: true });
        this.#init();
    }

    /**
     * Start listening for connections
     */
    listen (...args: any[]) {
        return this.#server.listen(...args);
    }

    /**
     * Close the server
     */
    close (callback?: (err?: Error) => void) {
        return this.#server.close(callback);
    }

    /**
     * Create a new endpoint
     */
    createEndpoint<Path extends string> (path: PondPath<Path>, handler: ConnectionHandler<Path>) {
        const endpoint = new EndpointEngine();

        this.#middleware.use((req, params, next) => {
            const event = parseAddress(path, req.address);

            if (!event) {
                return next();
            }

            const request: IncomingConnection<Path> = {
                ...event,
                cookies: this.#getCookies(req.headers),
                headers: req.headers,
                address: req.address,
                id: req.id,
            };

            const newParams: ConnectionResponseOptions = {
                params,
                engine: endpoint,
                webSocketServer: this.#socketServer,
            };

            const context = new ConnectionContext(request, newParams);

            return handler(context, next);
        });

        return new Endpoint(endpoint);
    }

    /**
     * Handle WebSocket upgrade requests
     */
    handleUpgrade (req: IncomingMessage, socket: internal.Duplex, head: Buffer<ArrayBufferLike>) {
        const clientId = req.headers['sec-websocket-key'] as string;
        const request: SocketRequest = {
            id: clientId,
            headers: req.headers,
            address: req.url || '',
        };

        const params: ConnectionParams = {
            head,
            socket,
            request: req,
            requestId: uuid(),
        };

        this.#middleware.run(request, params, (error) => {
            if (error) {
                const code = error?.statusCode || 400;
                const message = error?.message || 'Unauthorized connection';

                socket.write(`HTTP/1.1 ${code} ${message}\r\n\r\n`);
                socket.destroy();
            } else if (this.#exclusiveServer) {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                socket.destroy();
            }
        });
    }

    /**
     * Set up WebSocket heartbeat
     */
    #manageHeartbeat () {
        this.#socketServer.on('connection', (socket: WebSocket & { isAlive?: boolean }) => {
            socket.on('pong', () => {
                socket.isAlive = true;
            });
        });

        return setInterval(() => {
            this.#socketServer.clients.forEach((socket: WebSocket & { isAlive?: boolean }) => {
                if (socket.isAlive === false) {
                    return socket.terminate();
                }

                socket.isAlive = false;
                socket.ping();
            });
        }, 30000);
    }

    /**
     * Initialize the server
     */
    #init () {
        const timeout = this.#manageHeartbeat();

        this.#server.on('error', (error) => {
            clearInterval(timeout);
            throw new Error(error.message);
        });

        this.#server.on('close', () => {
            clearInterval(timeout);
        });

        this.#server.on('upgrade', this.handleUpgrade.bind(this));
    }

    /**
     * Parse cookies from headers
     */
    #getCookies (headers: IncomingHttpHeaders): Record<string, string> {
        const cookieHeader = headers.cookie;

        if (!cookieHeader) {
            return {};
        }

        return cookieHeader.split(';')
            .reduce((cookies, cookie) => {
                const [name, value] = cookie.trim()
                    .split('=');

                cookies[name] = decodeURIComponent(value);

                return cookies;
            }, {} as Record<string, string>);
    }
}
