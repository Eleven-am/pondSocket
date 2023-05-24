import { WebSocket } from 'ws';

import { Endpoint, SocketCache } from './endpoint';
import { PondResponse } from '../abstracts/abstractResponse';
import { ServerActions, ErrorTypes, SystemSender } from '../enums';
import { EndpointError } from '../errors/pondError';
import type { PondAssigns, PondMessage } from '../types';

export class ConnectionResponse extends PondResponse {
    readonly #webSocket: WebSocket;

    readonly #engine: Endpoint;

    readonly #clientId: string;

    #executed: boolean;

    constructor (webSocket: WebSocket, engine: Endpoint, clientId: string) {
        super();
        this.#webSocket = webSocket;
        this.#engine = engine;
        this.#clientId = clientId;
        this.#executed = false;
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept (assigns?: PondAssigns) {
        this.#performChecks();
        const cache: SocketCache = {
            clientId: this.#clientId,
            socket: this.#webSocket,
            assigns: assigns || {},
        };

        this.#engine.manageSocket(cache);
    }

    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    public reject (message?: string, errorCode?: number) {
        this.#performChecks();
        const payload = {
            message: message || 'Unauthorized connection',
            code: errorCode || 401,
        };

        this.#sendMessage(
            ServerActions.ERROR,
            ErrorTypes.UNAUTHORIZED_CONNECTION,
            payload,
        );

        this.#webSocket.close();
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public send (event: string, payload: PondMessage, assigns?: PondAssigns) {
        this.accept(assigns);
        this.#sendMessage(ServerActions.BROADCAST, event, payload);
    }

    /**
     * @desc Emits a direct message to the client
     * @param action - the action to perform
     * @param event - the event name
     * @param payload - the payload to send
     * @private
     */
    #sendMessage (action: ServerActions, event: string, payload: PondMessage) {
        const message = {
            action,
            event,
            payload,
            channelName: SystemSender.ENDPOINT,
        };

        this.#webSocket.send(JSON.stringify(message));
    }

    /**
     * @desc Performs checks to ensure the response has not been executed
     * @private
     */
    #performChecks (): void {
        if (this.#executed) {
            const message = 'Cannot execute response more than once';
            const code = 403;

            throw new EndpointError(message, code);
        }

        this.#executed = true;
    }
}
