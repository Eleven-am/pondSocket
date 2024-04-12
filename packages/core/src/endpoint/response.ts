import {
    ChannelEvent,
    ErrorTypes,
    PondAssigns,
    PondMessage,
    ServerActions,
    SystemSender,
    uuid,
} from '@eleven-am/pondsocket-common';
import { WebSocket } from 'ws';

import { EndpointEngine, SocketCache } from './endpoint';
import { EndpointError } from '../errors/pondError';

export class ConnectionResponse {
    readonly #webSocket: WebSocket;

    readonly #engine: EndpointEngine;

    readonly #clientId: string;

    #executed: boolean;

    #assigns: PondAssigns;

    readonly #requestId: string;

    constructor (webSocket: WebSocket, engine: EndpointEngine, clientId: string) {
        this.#webSocket = webSocket;
        this.#engine = engine;
        this.#clientId = clientId;
        this.#assigns = {};
        this.#executed = false;
        this.#requestId = uuid();
    }

    /**
     * @desc Whether the server has responded to the request
     */
    get hasResponded (): boolean {
        return this.#executed;
    }

    /**
     * @desc Assigns data to the user
     * @param assigns - the data to assign
     */
    public assign (assigns: PondAssigns): ConnectionResponse {
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

    /**
     * @desc Accepts the join request
     */
    public accept (): ConnectionResponse {
        this.#performChecks();
        const cache: SocketCache = {
            clientId: this.#clientId,
            socket: this.#webSocket,
            assigns: this.#assigns,
            subscriptions: new Map(),
        };

        this.#engine.manageSocket(cache);

        return this;
    }

    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    public decline (message?: string, errorCode?: number) {
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
     */
    public reply (event: string, payload: PondMessage): ConnectionResponse {
        if (this.#webSocket.readyState !== WebSocket.OPEN) {
            throw new EndpointError('Socket is not open', 400);
        }

        this.#sendMessage(ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Subscribes the client to a channel
     * @param channel - the channel to subscribe to
     */
    public subscribeTo (channel: string): ConnectionResponse {
        this.#engine.subscribeTo(this.#clientId, channel);

        return this;
    }

    /**
     * @desc Unsubscribes the client from a channel
     * @param channel - the channel to unsubscribe from
     */
    public unsubscribeFrom (channel: string): ConnectionResponse {
        this.#engine.unsubscribeFrom(this.#clientId, channel);

        return this;
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
            event,
            action,
            payload,
            requestId: this.#requestId,
            channelName: SystemSender.ENDPOINT,
        } as ChannelEvent;

        this.#engine.sendMessage(this.#webSocket, message);
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
