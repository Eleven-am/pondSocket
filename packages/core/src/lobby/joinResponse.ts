import {
    ChannelEvent,
    ChannelReceiver,
    ChannelReceivers,
    ErrorTypes,
    PondAssigns,
    PondMessage,
    PondObject,
    PondPresence,
    ServerActions,
} from '@eleven-am/pondsocket-common';

import { ChannelEngine } from '../channel/channel';
import { RequestCache } from '../endpoint/endpoint';
import { ChannelError } from '../errors/pondError';

export class JoinResponse {
    readonly #user: RequestCache;

    readonly #engine: ChannelEngine;

    #newAssigns: PondAssigns;

    #executed: boolean;

    #accepted: boolean;

    constructor (user: RequestCache, engine: ChannelEngine) {
        this.#user = user;
        this.#engine = engine;
        this.#executed = false;
        this.#accepted = false;
        this.#newAssigns = { ...user.assigns };
    }

    /**
     * @desc Whether the server has responded to the request
     */
    get hasResponded (): boolean {
        return this.#executed;
    }

    /**
     * @desc Assigns data to the client
     * @param assigns - the data to assign
     */
    public assign (assigns: PondAssigns): JoinResponse {
        if (this.#accepted) {
            this.#engine.updateAssigns(this.#user.clientId, assigns);
        } else {
            this.#newAssigns = {
                ...this.#newAssigns,
                ...assigns,
            };
        }

        return this;
    }

    /**
     * @desc Accepts the join request to the channel
     */
    public accept (): JoinResponse {
        this.#performChecks();
        const onMessage = this.#directMessage.bind(this);
        const unsubscribe = this.#engine.addUser(this.#user.clientId, this.#newAssigns, onMessage);

        this.#user.subscriptions.set(this.#engine.name, unsubscribe);
        this.#accepted = true;

        return this;
    }

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     */
    public decline (message?: string, errorCode?: number): JoinResponse {
        this.#performChecks();

        const errorMessage: ChannelEvent = {
            event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
            payload: {
                message: message || 'Unauthorized connection',
                code: errorCode || 401,
            },
            channelName: this.#engine.name,
            action: ServerActions.ERROR,
            requestId: this.#user.requestId,
        };

        this.#directMessage(errorMessage);

        return this;
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     */
    public reply (event: string, payload: PondMessage): JoinResponse {
        const message: ChannelEvent = {
            action: ServerActions.SYSTEM,
            channelName: this.#engine.name,
            requestId: this.#user.requestId,
            payload,
            event,
        };

        this.#directMessage(message);

        return this;
    }

    /**
     * @desc Sends a message to all clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcast (event: string, payload: PondMessage): JoinResponse {
        this.#sendMessage(ChannelReceiver.ALL_USERS, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to all clients in the channel except the client making the request
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcastFrom (event: string, payload: PondMessage): JoinResponse {
        this.#sendMessage(ChannelReceiver.ALL_EXCEPT_SENDER, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public broadcastTo (event: string, payload: PondMessage, userIds: string | string[]): JoinResponse {
        const ids = Array.isArray(userIds) ? userIds : [userIds];

        this.#sendMessage(ids, event, payload);

        return this;
    }

    /**
     * @desc Tracks a user's presence in the channel
     * @param presence - the initial presence data
     */
    public trackPresence (presence: PondPresence): JoinResponse {
        this.#engine.presenceEngine.trackPresence(this.#user.clientId, presence);

        return this;
    }

    /**
     * @desc Subscribes the client to a channel
     * @param channel - the channel to subscribe to
     */
    public subscribeTo (channel: string): JoinResponse {
        this.#engine.subscribeTo(this.#user.clientId, channel);

        return this;
    }

    /**
     * @desc Unsubscribes the client from a channel
     * @param channel - the channel to unsubscribe from
     */
    public unsubscribeFrom (channel: string): JoinResponse {
        this.#engine.unsubscribeFrom(this.#user.clientId, channel);

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

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param recipient - the ids of the clients to send the message to
     * @param event - the event to send
     * @param payload - the payload to send
     * @private
     */
    #sendMessage (recipient: ChannelReceivers, event: string, payload: PondObject) {
        this.#engine.sendMessage(this.#user.clientId, recipient, ServerActions.BROADCAST, event, payload, this.#user.requestId);
    }

    /**
     * @desc Sends a direct message to the client
     * @param event
     * @private
     */
    #directMessage (event: ChannelEvent) {
        this.#engine.parent.parent.sendMessage(this.#user.socket, event);
    }
}
