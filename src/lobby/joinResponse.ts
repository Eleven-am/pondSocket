import { PondResponse } from '../abstracts/abstractResponse';
import { ChannelEngine } from '../channel/channel';
import { RequestCache } from '../endpoint/endpoint';
import { ErrorTypes, ServerActions, SystemSender, ChannelReceiver, Events } from '../enums';
import { ChannelError } from '../errors/pondError';
import type { PondAssigns, ChannelEvent, PondMessage, PondPresence } from '../types';

export class JoinResponse extends PondResponse {
    readonly #user: RequestCache;

    readonly #engine: ChannelEngine;

    #executed: boolean;

    constructor (user: RequestCache, engine: ChannelEngine) {
        super();
        this.#user = user;
        this.#engine = engine;
        this.#executed = false;
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept (assigns?: PondAssigns): JoinResponse {
        this.#performChecks();

        const newAssigns = {
            ...assigns || {},
            ...this.#user.assigns,
        };

        const acknowledgement: ChannelEvent = {
            action: ServerActions.SYSTEM,
            channelName: this.#engine.name,
            event: Events.ACKNOWLEDGE,
            payload: {},
        };

        this.#user.socket.send(JSON.stringify(acknowledgement));
        this.#engine.addUser(this.#user.clientId, newAssigns, (event) => {
            this.#user.socket.send(JSON.stringify(event));
        });

        return this;
    }

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     */
    public reject (message?: string, errorCode?: number): JoinResponse {
        this.#performChecks();

        const text = `Request to join channel ${this.#engine.name} rejected: ${message || 'Unauthorized request'}`;

        const errorMessage: ChannelEvent = {
            event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
            payload: {
                message: text,
                code: errorCode || 403,
            },
            channelName: this.#engine.name,
            action: ServerActions.ERROR,
        };

        this.#user.socket.send(JSON.stringify(errorMessage));

        return this;
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public send (event: string, payload: PondMessage, assigns?: PondAssigns): JoinResponse {
        this.accept(assigns);
        this.#engine.sendMessage(SystemSender.CHANNEL, [this.#user.clientId], ServerActions.SYSTEM, event, payload);

        return this;
    }

    /**
     * @desc Emits a message to all clients in the channel
     * @param event - the event name
     * @param payload - the payload to send
     */
    public broadcast (event: string, payload: PondMessage): JoinResponse {
        this.#engine.sendMessage(this.#user.clientId, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Emits a message to all clients in the channel except the sender
     * @param event - the event name
     * @param payload - the payload to send
     */
    public broadcastFromUser (event: string, payload: PondMessage): JoinResponse {
        this.#engine.sendMessage(this.#user.clientId, ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Emits a message to a specific set of clients
     * @param event - the event name
     * @param payload  - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public sendToUsers (event: string, payload: PondMessage, userIds: string[]): JoinResponse {
        this.#engine.sendMessage(this.#user.clientId, userIds, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc tracks the presence of a client
     * @param presence - the presence data to track
     */
    public trackPresence (presence: PondPresence): JoinResponse {
        this.#engine.trackPresence(this.#user.clientId, presence);

        return this;
    }

    /**
     * @desc Performs checks to ensure the response has not been executed
     * @private
     */
    #performChecks (): void {
        if (this.#executed) {
            const message = `Request to join channel ${this.#engine.name} rejected: Request already executed`;
            const code = 403;

            throw new ChannelError(message, code, this.#engine.name);
        }

        this.#executed = true;
    }
}
