import {
    EventParams,
    PondEvent,
    PondObject,
    ServerActions,
    PondPresence,
    PondMessage,
    ChannelReceiver,
    ChannelReceivers,
    SystemSender,
    PondAssigns,
} from '@eleven-am/pondsocket-common';

import { BroadcastEvent } from '../abstracts/types';
import { ChannelEngine } from '../engines/channelEngine';
import { Channel } from '../wrappers/channel';

/**
 * EventContext combines the functionality of EventRequest and EventResponse
 * to provide a unified interface for handling events in a channel.
 */
export class EventContext<Path extends string> {
    readonly #event: BroadcastEvent;

    readonly #engine: ChannelEngine;

    readonly #params: EventParams<Path>;

    readonly #requestId: string;

    constructor (event: BroadcastEvent, params: EventParams<Path>, engine: ChannelEngine) {
        this.#event = event;
        this.#params = params;
        this.#engine = engine;
        this.#requestId = event.requestId;
    }

    /**
     * The event information
     */
    get event (): PondEvent<Path> {
        return {
            event: this.#event.event,
            query: this.#params.query,
            params: this.#params.params,
            payload: this.#event.payload,
        };
    }

    /**
     * The channel name
     */
    get channelName (): string {
        return this.#engine.name;
    }

    /**
     * The channel instance
     */
    get channel (): Channel {
        return new Channel(this.#engine);
    }

    /**
     * All current presences in the channel
     */
    get presences () {
        return this.#engine.getPresence();
    }

    /**
     * All current assigns in the channel
     */
    get assigns () {
        return this.#engine.getAssigns();
    }

    /**
     * The user who sent the request
     */
    get user () {
        return this.#engine.getUserData(this.#event.sender);
    }

    /**
     * Assigns data to the client
     */
    assign (assigns: PondAssigns): EventContext<Path> {
        this.#engine.updateAssigns(this.#event.sender, assigns);

        return this;
    }

    /**
     * Sends a direct reply to the client
     */
    reply (event: string, payload: PondMessage) {
        this.#engine.sendMessage(
            SystemSender.CHANNEL,
            [this.#event.sender],
            ServerActions.SYSTEM,
            event,
            payload,
            this.#requestId,
        );

        return this;
    }

    /**
     * Broadcasts a message to all users in the channel
     */
    broadcast (event: string, payload: PondMessage): EventContext<Path> {
        this.#sendMessage(ChannelReceiver.ALL_USERS, event, payload);

        return this;
    }

    /**
     * Broadcasts a message to all users except the sender
     */
    broadcastFrom (event: string, payload: PondMessage): EventContext<Path> {
        this.#sendMessage(ChannelReceiver.ALL_EXCEPT_SENDER, event, payload);

        return this;
    }

    /**
     * Broadcasts a message to specific users
     */
    broadcastTo (event: string, payload: PondMessage, userIds: string | string[]): EventContext<Path> {
        const ids = Array.isArray(userIds) ? userIds : [userIds];

        this.#sendMessage(ids, event, payload);

        return this;
    }

    /**
     * Tracks a user's presence
     */
    trackPresence (presence: PondPresence, userId = this.#event.sender): EventContext<Path> {
        this.#engine.trackPresence(userId, presence);

        return this;
    }

    /**
     * Updates a user's presence
     */
    updatePresence (presence: PondPresence, userId = this.#event.sender): EventContext<Path> {
        this.#engine.updatePresence(userId, presence);

        return this;
    }

    /**
     * Kicks a user from the channel
     */
    evictUser (reason: string, userId = this.#event.sender): EventContext<Path> {
        this.#engine.kickUser(userId, reason);

        return this;
    }

    /**
     * Removes a user's presence
     */
    removePresence (userId = this.#event.sender): EventContext<Path> {
        this.#engine.removePresence(userId);

        return this;
    }

    /**
     * Sends a message to recipients
     */
    #sendMessage (recipient: ChannelReceivers, event: string, payload: PondObject) {
        this.#engine.sendMessage(
            this.#event.sender,
            recipient,
            ServerActions.BROADCAST,
            event,
            payload,
            this.#requestId,
        );
    }
}
