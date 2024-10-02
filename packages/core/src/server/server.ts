import { Server as HTTPServer, IncomingHttpHeaders } from 'http';

import { IncomingConnection, PondPath, uuid } from '@eleven-am/pondsocket-common';
import { WebSocket, WebSocketServer } from 'ws';

import { Middleware } from '../abstracts/middleware';
import { RedisClient } from '../abstracts/redisClient';
import {
    SocketRequest,
    PondSocketOptions,
    ConnectionHandler,
    ConnectionParams,
    ConnectionResponseOptions,
} from '../abstracts/types';
import { EndpointEngine } from '../engines/endpointEngine';
import { parseAddress } from '../matcher/matcher';
import { ConnectionResponse } from '../responses/connectionResponse';
import { Endpoint } from '../wrappers/endpoint';

export class PondSocket {
    readonly #server: HTTPServer;

    readonly #socketServer: WebSocketServer;

    readonly #redisClient: RedisClient | null;

    readonly #middleware: Middleware<SocketRequest, ConnectionParams>;

    constructor ({ server, socketServer, redisOptions }: PondSocketOptions = {}) {
        this.#middleware = new Middleware();
        this.#server = server ?? new HTTPServer();
        this.#redisClient = redisOptions ? new RedisClient(redisOptions) : null;
        this.#socketServer = socketServer ?? new WebSocketServer({ noServer: true });
        this.#init();
    }

    listen (...args: any[]) {
        if (this.#redisClient) {
            this.#redisClient.initialize()
                .then(() => this.#server.listen(...args));
        } else {
            return this.#server.listen(...args);
        }
    }

    close (callback?: (err?: Error) => void) {
        return this.#server.close(callback);
    }

    createEndpoint<Path extends string> (path: PondPath<Path>, handler: ConnectionHandler<Path>) {
        const endpoint = new EndpointEngine(this.#redisClient?.buildClient(String(path)) ?? null);

        this.#middleware.use((req, params, next) => {
            const event = parseAddress(path, req.address);

            if (event) {
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

                const response = new ConnectionResponse(request.id, newParams);

                return handler(request, response, next);
            }

            return next();
        });

        return new Endpoint(endpoint);
    }

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

    #init () {
        const timeout = this.#manageHeartbeat();

        this.#server.on('error', async (error) => {
            clearInterval(timeout);
            await this.#redisClient?.shutdown();
            throw new Error(error.message);
        });

        this.#server.on('close', async () => {
            clearInterval(timeout);
            await this.#redisClient?.shutdown();
        });

        this.#server.on('upgrade', (req, socket, head) => {
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
                const code = error?.statusCode || 400;
                const message = error?.message || 'Unauthorized connection';

                socket.write(`HTTP/1.1 ${code} ${message}\r\n\r\n`);
                socket.destroy();
            });
        });
    }

    #getCookies (headers: IncomingHttpHeaders): Record<string, string> {
        const cookieHeader = headers.cookie;

        if (!cookieHeader) {
            return {};
        }

        return cookieHeader.split(';').reduce((cookies, cookie) => {
            const [name, value] = cookie.trim().split('=');

            cookies[name] = decodeURIComponent(value);

            return cookies;
        }, {} as Record<string, string>);
    }
}
