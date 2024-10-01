import {
    ChannelReceivers,
    PondObject,
    ServerActions,
    PondPresence,
    PondMessage,
    ChannelReceiver,
    SystemSender,
    PondAssigns,
} from '@eleven-am/pondsocket-common';

import { BroadcastEvent } from '../abstracts/types';
import { ChannelEngine } from '../engines/channelEngine';

export class EventResponse {
    readonly #event: BroadcastEvent;

    readonly #engine: ChannelEngine;

    readonly #requestId: string;

    constructor (event: BroadcastEvent, engine: ChannelEngine) {
        this.#event = event;
        this.#engine = engine;
        this.#requestId = event.requestId;
    }

    assign (assigns: PondAssigns): EventResponse {
        this.#engine.updateAssigns(this.#event.sender, assigns);

        return this;
    }

    reply (event: string, payload: PondMessage) {
        this.#engine.sendMessage(SystemSender.CHANNEL, [this.#event.sender], ServerActions.SYSTEM, event, payload, this.#requestId);

        return this;
    }

    broadcast (event: string, payload: PondMessage): EventResponse {
        this.#sendMessage(ChannelReceiver.ALL_USERS, event, payload);

        return this;
    }

    broadcastFrom (event: string, payload: PondMessage): EventResponse {
        this.#sendMessage(ChannelReceiver.ALL_EXCEPT_SENDER, event, payload);

        return this;
    }

    broadcastTo (event: string, payload: PondMessage, userIds: string | string[]): EventResponse {
        const ids = Array.isArray(userIds) ? userIds : [userIds];

        this.#sendMessage(ids, event, payload);

        return this;
    }

    trackPresence (presence: PondPresence, userId = this.#event.sender): EventResponse {
        this.#engine.trackPresence(userId, presence);

        return this;
    }

    updatePresence (presence: PondPresence, userId = this.#event.sender): EventResponse {
        this.#engine.updatePresence(userId, presence);

        return this;
    }

    evictUser (reason: string, userId = this.#event.sender): EventResponse {
        this.#engine.kickUser(userId, reason);

        return this;
    }

    removePresence (userId = this.#event.sender): EventResponse {
        this.#engine.removePresence(userId);

        return this;
    }

    #sendMessage (recipient: ChannelReceivers, event: string, payload: PondObject) {
        this.#engine.sendMessage(this.#event.sender, recipient, ServerActions.BROADCAST, event, payload, this.#requestId);
    }
}
