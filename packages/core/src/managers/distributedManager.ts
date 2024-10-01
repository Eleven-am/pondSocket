import { PondPresence, PondAssigns, Unsubscribe } from '@eleven-am/pondsocket-common';

import { Manager, ActionTypes } from './manager';
import { Client, InternalChannelEvent } from '../abstracts/types';

export class DistributedManager extends Manager {
    readonly #client: Client;

    #subscriptions: Unsubscribe | null = null;

    constructor (client: Client) {
        super(client.channelId);
        this.#client = client;
    }

    trackPresence (userId: string, data: PondPresence) {
        const message = this.processPresenceData(ActionTypes.CREATE, userId, data);

        this.#client.publishPresenceChange(userId, data);

        return this.broadcast(message);
    }

    updatePresence (userId: string, data: PondPresence) {
        const message = this.processPresenceData(ActionTypes.UPDATE, userId, data);

        this.#client.publishPresenceChange(userId, data);

        return this.broadcast(message);
    }

    removePresence (userId: string) {
        const message = this.processPresenceData(ActionTypes.DELETE, userId, null);

        this.#client.publishPresenceChange(userId, null);

        return this.broadcast(message);
    }

    setAssigns (userId: string, data: PondAssigns) {
        this.processAssignsData(ActionTypes.CREATE, userId, data);
        this.#client.publishAssignsChange(userId, data);
    }

    updateAssigns (userId: string, data: PondAssigns) {
        this.processAssignsData(ActionTypes.UPDATE, userId, data);
        this.#client.publishAssignsChange(userId, data);
    }

    removeAssigns (userId: string) {
        this.processAssignsData(ActionTypes.DELETE, userId, null);
        this.#client.publishAssignsChange(userId, null);
    }

    removeUser (userId: string) {
        const userData = super.removeUser(userId);

        this.#client.publishUserLeave(userId);

        return userData;
    }

    broadcast (message: InternalChannelEvent) {
        this.#client.publishChannelMessage(message);
    }

    async initialize (unsubscribe: Unsubscribe) {
        await super.initialize(unsubscribe);

        this.presenceCache = await this.#client.getPresenceCache();
        this.assignsCache = await this.#client.getAssignsCache();

        const leaveSubscription = this.#client.subscribeToUserLeaves((userId) => {
            this.userSubscriptions.get(userId)?.();
            this.userSubscriptions.delete(userId);
        });

        const presenceSubscription = this.#client.subscribeToPresenceChanges(({ userId, state }) => {
            if (state) {
                this.presenceCache.set(userId, state);
            } else {
                this.presenceCache.delete(userId);
            }
        });

        const assignSubscription = this.#client.subscribeToAssignsChanges(({ userId, state }) => {
            if (state) {
                this.assignsCache.set(userId, state);
            } else {
                this.assignsCache.delete(userId);
            }
        });

        const messageSubscription = this.#client.subscribeToChannelMessages((message) => {
            this.publisher.publish(message);
        });

        this.#subscriptions = () => {
            leaveSubscription();
            presenceSubscription();
            assignSubscription();
            messageSubscription();
        };
    }

    close () {
        this.#subscriptions?.();

        return super.close();
    }
}
