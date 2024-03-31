import {
    ChannelReceiver,
    ChannelReceivers,
    PondAssigns,
    PondMessage,
    PondObject,
    PondPresence,
    ServerActions,
    SystemSender,
} from '@eleven-am/pondsocket-common';

import { BroadcastEvent, ChannelEngine } from './channel';

export class EventResponse {
    readonly #event: BroadcastEvent;

    readonly #engine: ChannelEngine;

    readonly #requestId: string;

    constructor (event: BroadcastEvent, engine: ChannelEngine) {
        this.#event = event;
        this.#engine = engine;
        this.#requestId = event.requestId;
    }

    /**
     * @desc Assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public assign (assigns: PondAssigns): EventResponse {
        this.#manageAssigns(assigns);

        return this;
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     */
    public reply (event: string, payload: PondMessage) {
        this.#engine.sendMessage(SystemSender.CHANNEL, [this.#event.sender], ServerActions.SYSTEM, event, payload, this.#requestId);

        return this;
    }

    /**
     * @desc Sends a message to all clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcast (event: string, payload: PondMessage): EventResponse {
        this.#sendMessage(ChannelReceiver.ALL_USERS, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to all clients in the channel except the client making the request
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcastFrom (event: string, payload: PondMessage): EventResponse {
        this.#sendMessage(ChannelReceiver.ALL_EXCEPT_SENDER, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public broadcastTo (event: string, payload: PondMessage, userIds: string | string[]): EventResponse {
        const ids = Array.isArray(userIds) ? userIds : [userIds];

        this.#sendMessage(ids, event, payload);

        return this;
    }

    /**
     * @desc Tracks a user's presence in the channel
     * @param presence - the initial presence data
     * @param userId - the id of the user to track
     */
    public trackPresence (presence: PondPresence, userId = this.#event.sender): EventResponse {
        this.#engine.presenceEngine.trackPresence(userId, presence);

        return this;
    }

    /**
     * @desc Updates a user's presence in the channel
     * @param presence - the updated presence data
     * @param userId - the id of the user to update
     */
    public updatePresence (presence: PondPresence, userId = this.#event.sender): EventResponse {
        this.#engine.presenceEngine.updatePresence(userId, presence);

        return this;
    }

    /**
     * @desc Removes a user's presence from the channel
     * @param userId - the id of the user to remove
     */
    public removePresence (userId = this.#event.sender): EventResponse {
        this.#engine.presenceEngine.removePresence(userId);

        return this;
    }

    /**
     * @desc Subscribes the client to a channel
     * @param channel - the channel to subscribe to
     */
    public subscribeTo (channel: string): EventResponse {
        this.#engine.subscribeTo(this.#event.sender, channel);

        return this;
    }

    /**
     * @desc Unsubscribes the client from a channel
     * @param channel - the channel to unsubscribe from
     */
    public unsubscribeFrom (channel: string): EventResponse {
        this.#engine.unsubscribeFrom(this.#event.sender, channel);

        return this;
    }

    /**
     * @desc Evicts a user from the channel
     * @param reason - the reason for the eviction
     * @param userId - the id of the user to evict,
     */
    public evictUser (reason: string, userId = this.#event.sender): EventResponse {
        this.#engine.kickUser(userId, reason);

        return this;
    }

    /**
     * @desc Closes the channel from the server side for all clients
     * @param reason - the reason for closing the channel
     */
    public closeChannel (reason: string): void {
        this.#engine.destroy(reason);
    }

    /**
     * @desc Gets the event that triggered the response
     * @param assigns - the data to assign to the client
     * @private
     */
    #manageAssigns (assigns?: PondAssigns): void {
        if (assigns) {
            this.#engine.updateAssigns(this.#event.sender, assigns);
        }
    }

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param recipient - the ids of the clients to send the message to
     * @param event - the event to send
     * @param payload - the payload to send
     * @private
     */
    #sendMessage (recipient: ChannelReceivers, event: string, payload: PondObject) {
        this.#engine.sendMessage(this.#event.sender, recipient, ServerActions.BROADCAST, event, payload, this.#requestId);
    }
}
