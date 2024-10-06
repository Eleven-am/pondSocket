import {
    PondPresence,
    PondAssigns,
    Unsubscribe,
    PresenceEventTypes,
    uuid,
    ServerActions,
} from '@eleven-am/pondsocket-common';

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
        const assigns = this.processAssignsData(ActionTypes.CREATE, userId, data);

        this.#client.publishAssignsChange(userId, assigns);
    }

    updateAssigns (userId: string, data: PondAssigns) {
        const assigns = this.processAssignsData(ActionTypes.UPDATE, userId, data);

        this.#client.publishAssignsChange(userId, assigns);
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

    initialize (unsubscribe: Unsubscribe) {
        super.initialize(unsubscribe);

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

        const stateSyncSubscription = this.#client.subscribeToStateSync((state) => {
            this.assignsCache = new Map(state.assigns);
            this.#parseAndUpdatePresence(new Map(state.presence), state.initialFetch);
        });

        this.#subscriptions = () => {
            leaveSubscription();
            presenceSubscription();
            assignSubscription();
            messageSubscription();
            stateSyncSubscription();
        };
    }

    close () {
        this.#subscriptions?.();

        return super.close();
    }

    #parseAndUpdatePresence (newCache: Map<string, PondPresence>, initialFetch: boolean) {
        if (initialFetch) {
            this.presenceCache = newCache;
        }

        const newUsers = new Set(newCache.keys());
        const oldUsers = new Set(this.presenceCache.keys());
        const usersToAdd = new Set([...newUsers].filter((user) => !oldUsers.has(user)));
        const usersToRemove = new Set([...oldUsers].filter((user) => !newUsers.has(user)));
        const noChange = new Set([...newUsers].filter((user) => oldUsers.has(user)));

        const usersToUpdate = new Set([...noChange]
            .filter((user) => {
                const oldData = this.presenceCache.get(user);
                const newData = newCache.get(user);

                return JSON.stringify(oldData) !== JSON.stringify(newData);
            }));

        const upSertInfo = [
            ...[...usersToAdd]
                .map((user) => ({
                    userId: user,
                    state: newCache.get(user)!,
                    event: PresenceEventTypes.JOIN,
                })),
            ...[...usersToUpdate]
                .map((user) => ({
                    userId: user,
                    state: newCache.get(user)!,
                    event: PresenceEventTypes.UPDATE,
                })),
        ];

        const upsertMessages = upSertInfo.map(({ userId, state, event }) => {
            this.presenceCache.set(userId, state);

            return {
                event,
                requestId: uuid(),
                recipients: Array.from(this.presenceCache.keys()),
                channelName: this.channelId,
                action: ServerActions.PRESENCE,
                payload: {
                    changed: state,
                    presence: Array.from(this.presenceCache.values()),
                },
            };
        });

        const removeMessages = [...usersToRemove].map((user) => {
            const current = this.presenceCache.get(user)!;

            this.presenceCache.delete(user);

            return {
                event: PresenceEventTypes.LEAVE,
                requestId: uuid(),
                recipients: Array.from(this.presenceCache.keys()),
                channelName: this.channelId,
                action: ServerActions.PRESENCE,
                payload: {
                    changed: current,
                    presence: Array.from(this.presenceCache.values()),
                },
            };
        });

        [...upsertMessages, ...removeMessages].forEach((message) => this.broadcast(message));
    }
}
