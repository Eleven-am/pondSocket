import { PondAssigns, PondMessage, ChannelEvent, SystemSender, ServerActions } from '@eleven-am/pondsocket-common';
import { WebSocketServer } from 'ws';

import { ConnectionParams, SocketCache, ConnectionResponseOptions } from '../abstracts/types';
import { EndpointEngine } from '../engines/endpointEngine';
import { HttpError } from '../errors/httpError';

export class ConnectionResponse {
    #executed: boolean;

    #assigns: PondAssigns;

    readonly #clientId: string;

    readonly #engine: EndpointEngine;

    readonly #params: ConnectionParams;

    readonly #webSocketServer: WebSocketServer;

    constructor (clientId: string, { engine, params, webSocketServer }: ConnectionResponseOptions) {
        this.#webSocketServer = webSocketServer;
        this.#clientId = clientId;
        this.#executed = false;
        this.#engine = engine;
        this.#params = params;
        this.#assigns = {};
    }

    assign (assigns: PondAssigns): ConnectionResponse {
        if (!this.#executed) {
            this.#assigns = {
                ...this.#assigns,
                ...assigns,
            };
        } else {
            const user = this.#engine.getUser(this.#clientId);

            user.assigns = {
                ...user.assigns,
                ...assigns,
            };
        }

        return this;
    }

    accept (): ConnectionResponse {
        this.#performChecks();

        this.#webSocketServer.handleUpgrade(
            this.#params.request,
            this.#params.socket,
            this.#params.head,
            (ws) => {
                const cache: SocketCache = {
                    clientId: this.#clientId,
                    subscriptions: new Set(),
                    assigns: this.#assigns,
                    socket: ws,
                };

                this.#webSocketServer.emit('connection', ws);
                this.#engine.manageSocket(cache);
            },
        );

        return this;
    }

    decline (message?: string, errorCode?: number): ConnectionResponse {
        this.#performChecks();
        const code = errorCode || 400;
        const { socket } = this.#params;
        const newMessage = message || 'Unauthorized connection';

        socket.write(`HTTP/1.1 ${code} ${newMessage}\r\n\r\n`);
        socket.destroy();

        return this;
    }

    reply (event: string, payload: PondMessage): ConnectionResponse {
        if (!this.#executed) {
            throw new HttpError(400, 'Connection has not been accepted');
        }

        const { socket } = this.#engine.getUser(this.#clientId);

        const message: ChannelEvent = {
            event,
            payload,
            action: ServerActions.BROADCAST,
            requestId: this.#params.requestId,
            channelName: SystemSender.ENDPOINT,
        };

        this.#engine.sendMessage(socket, message);

        return this;
    }

    #performChecks (): void {
        if (this.#executed) {
            throw new HttpError(400, 'Response has already been executed');
        }

        this.#executed = true;
    }
}
