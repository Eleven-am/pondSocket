import {
    PondAssigns,
    PondPresence,
    PresenceEventTypes,
    ChannelEvent,
    Subject,
    ServerActions,
    uuid,
    PondObject,
    Unsubscribe,
    UserData,
} from '@eleven-am/pondsocket-common';

import { InternalChannelEvent } from '../abstracts/types';
import { HttpError } from '../errors/httpError';

enum DataTypes {
    PRESENCE = 'presence',
    ASSIGNS = 'assigns',
}

export enum ActionTypes {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
}

export abstract class Manager {
    protected userSubscriptions: Map<string, Unsubscribe> = new Map();

    protected publisher: Subject<InternalChannelEvent> = new Subject();

    protected presenceCache: Map<string, PondPresence> = new Map();

    protected assignsCache: Map<string, PondAssigns> = new Map();

    #onClose: Unsubscribe | null = null;

    protected constructor (protected readonly channelId: string) {}

    get userIds () {
        return new Set(this.assignsCache.keys());
    }

    initialize (unsubscribe: Unsubscribe) {
        this.#onClose = unsubscribe;
    }

    getPresence (userId: string) {
        return this.presenceCache.get(userId) || null;
    }

    getAllPresence () {
        return new Map(this.presenceCache);
    }

    abstract trackPresence(userId: string, data: PondPresence): void;

    abstract updatePresence(userId: string, data: PondPresence): void;

    abstract removePresence(userId: string): void;

    abstract updateAssigns(userId: string, data: PondAssigns): void;

    abstract broadcast (message: InternalChannelEvent): void;

    upsertPresence (userId: string, data: PondPresence) {
        if (this.presenceCache.has(userId)) {
            this.updatePresence(userId, data);
        } else {
            this.trackPresence(userId, data);
        }
    }

    getAssigns (userId: string) {
        return this.assignsCache.get(userId) || null;
    }

    getAllAssigns () {
        return new Map(this.assignsCache);
    }

    close () {
        this.publisher.close();
        this.presenceCache.clear();
        this.assignsCache.clear();
        this.userSubscriptions.forEach((unsubscribe) => unsubscribe());
        this.userSubscriptions.clear();
        this.#onClose?.();
    }


    addUser (userId: string, assigns: PondAssigns, onMessage: (event: ChannelEvent) => void) {
        this.setAssigns(userId, assigns);

        const subscription = this.publisher.subscribe(({ recipients, ...event }) => {
            if (recipients.includes(userId)) {
                onMessage(event);
            }
        });

        this.userSubscriptions.set(userId, subscription);
    }

    removeUser (userId: string) {
        const userData = this.getUserData(userId);

        try {
            this.removePresence(userId);
            this.removeAssigns(userId);
            this.userSubscriptions.get(userId)?.();
            this.userSubscriptions.delete(userId);

            if (this.assignsCache.size === 0) {
                this.close();
            }
        } catch (error) {
            // no-op
        }

        return userData;
    }

    getUserData (userId: string): UserData {
        const presence = this.getPresence(userId);
        const assigns = this.getAssigns(userId);

        if (!presence && !assigns) {
            const message = `User with id ${userId} does not exist in the channel ${this.channelId}`;
            const code = 404;

            throw new HttpError(code, message);
        }

        return {
            assigns: assigns || {},
            presence: presence || {},
            id: userId,
        };
    }

    protected abstract setAssigns(userId: string, data: PondAssigns): void;

    protected abstract removeAssigns(userId: string): void;

    protected processPresenceData (action: ActionTypes, userId: string, data: PondPresence | null): InternalChannelEvent {
        const current = this.#processData(this.presenceCache, DataTypes.PRESENCE, action, userId, data);

        const total = Array.from(this.presenceCache.values());
        const userIds = Array.from(this.presenceCache.keys());
        const event = action === ActionTypes.CREATE ? PresenceEventTypes.JOIN : action === ActionTypes.UPDATE ? PresenceEventTypes.UPDATE : PresenceEventTypes.LEAVE;

        return {
            event,
            requestId: uuid(),
            recipients: userIds,
            channelName: this.channelId,
            action: ServerActions.PRESENCE,
            payload: {
                changed: current,
                presence: total,
            },
        };
    }

    protected processAssignsData (action: ActionTypes, userId: string, data: PondAssigns | null): PondAssigns {
        return this.#processData(this.assignsCache, DataTypes.ASSIGNS, action, userId, data);
    }

    #processData (cache: Map<string, PondObject>, dataType: DataTypes, action: ActionTypes, userId: string, data: PondObject | null): PondObject {
        if (action === ActionTypes.CREATE && cache.has(userId)) {
            const message = `User with id ${userId} already exists in the ${dataType} cache`;
            const code = 409;

            throw new HttpError(code, message);
        } else if ((action === ActionTypes.UPDATE || action === ActionTypes.DELETE) && !cache.has(userId)) {
            const message = `User with id ${userId} does not exist in the ${dataType} cache`;
            const code = 404;

            throw new HttpError(code, message);
        }

        if (action !== ActionTypes.DELETE && !data) {
            const message = `Data is required for ${action} action`;
            const code = 400;

            throw new HttpError(code, message);
        }

        const current = cache.get(userId);

        if (data) {
            const updated = {
                ...current,
                ...data,
            };

            cache.set(userId, updated);

            return updated;
        }

        cache.delete(userId);

        return current || {};
    }
}
