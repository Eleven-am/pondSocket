import {
    SystemSender,
    ChannelReceiver,
    ServerActions,
    PondMessage,
    PondAssigns,
    PondPresence,
} from '@eleven-am/pondsocket-common';

import { ChannelEngine } from '../engines/channelEngine';

export class Channel {
    readonly #engine: ChannelEngine;

    constructor (engine: ChannelEngine) {
        this.#engine = engine;
    }

    getUserData (userId: string) {
        return this.#engine.getUser(userId);
    }

    getPresences () {
        return this.#engine.getPresence();
    }

    getAssigns () {
        return this.#engine.getAssigns();
    }

    broadcast (event: string, payload: PondMessage) {
        this.#engine.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, event, payload);

        return this;
    }

    broadcastFrom (userId: string, event: string, payload: PondMessage) {
        this.#engine.sendMessage(userId, ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, event, payload);

        return this;
    }

    broadcastTo (userIds: string | string[], event: string, payload: PondMessage) {
        const users = Array.isArray(userIds) ? userIds : [userIds];

        this.#engine.sendMessage(SystemSender.CHANNEL, users, ServerActions.BROADCAST, event, payload);

        return this;
    }

    evictUser (userId: string, reason?: string) {
        this.#engine.kickUser(userId, reason ?? 'You have been banned from the channel');

        return this;
    }

    trackPresence (userId: string, presence: PondPresence) {
        this.#engine.trackPresence(userId, presence);

        return this;
    }

    updatePresence (userId: string, presence: PondPresence) {
        this.#engine.updatePresence(userId, presence);

        return this;
    }

    removePresence (userId: string) {
        this.#engine.removePresence(userId);

        return this;
    }

    upsertPresence (userId: string, presence: PondPresence) {
        this.#engine.upsertPresence(userId, presence);

        return this;
    }

    updateAssigns (userId: string, assigns: PondAssigns) {
        this.#engine.updateAssigns(userId, assigns);

        return this;
    }
}
