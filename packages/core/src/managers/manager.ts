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

    /**
     * @desc Initializes the data manager
     * @param unsubscribe - The callback to call when the manager is closed
     */
    initialize (unsubscribe: Unsubscribe) {
        this.#onClose = unsubscribe;

        return Promise.resolve();
    }

    /**
     * @desc Returns the presence of a user
     * @param userId - The id of the user
     */
    getPresence (userId: string) {
        return this.presenceCache.get(userId) || null;
    }

    /**
     * @desc Returns all the presence
     */
    getAllPresence () {
        return new Map(this.presenceCache);
    }

    /**
     * @desc Sets the presence of a user
     * @param userId - The id of the user
     * @param data - The presence data
     */
    abstract trackPresence(userId: string, data: PondPresence): void;

    /**
     * @desc Updates the presence of a user
     * @param userId - The id of the user
     * @param data - The presence data
     */
    abstract updatePresence(userId: string, data: PondPresence): void;

    /**
     * @desc Removes the presence of a user
     * @param userId - The id of the user
     */
    abstract removePresence(userId: string): void;

    /**
     * @desc Creates or updates the presence of a user
     * @param userId - The id of the user
     * @param data - The presence data
     */
    upsertPresence (userId: string, data: PondPresence) {
        if (this.presenceCache.has(userId)) {
            this.updatePresence(userId, data);
        } else {
            this.trackPresence(userId, data);
        }
    }

    /**
     * @desc Returns the assigns of a user
     * @param userId - The id of the user
     */
    getAssigns (userId: string) {
        return this.assignsCache.get(userId) || null;
    }

    /**
     * @desc Returns all the assigns
     */
    getAllAssigns () {
        return new Map(this.assignsCache);
    }

    /**
     * @desc Updates the assigns of a user
     * @param userId - The id of the user
     * @param data - The assigns data
     */
    abstract updateAssigns(userId: string, data: PondAssigns): void;

    /**
     * @desc Closes the data manager
     */
    close () {
        this.publisher.close();
        this.presenceCache.clear();
        this.assignsCache.clear();
        this.userSubscriptions.forEach((unsubscribe) => unsubscribe());
        this.userSubscriptions.clear();
        this.#onClose?.();
    }

    /**
     * @desc Broadcasts a message to all users
     * @param message - The message to broadcast
     */
    abstract broadcast (message: InternalChannelEvent): void;

    /**
     * @desc Subscribes to incoming messages
     * @param userId - The id of the user
     * @param assigns - The assigns of the user
     * @param onMessage - The callback to call when a message is received
     */
    addUser (userId: string, assigns: PondAssigns, onMessage: (event: ChannelEvent) => void) {
        this.setAssigns(userId, assigns);

        const subscription = this.publisher.subscribe(({ recipients, ...event }) => {
            if (recipients.includes(userId)) {
                onMessage(event);
            }
        });

        this.userSubscriptions.set(userId, subscription);
    }

    /**
     * @desc Unsubscribes from incoming messages
     * @param userId - The id of the user
     */
    removeUser (userId: string) {
        const userData = this.getUserData(userId);

        this.removePresence(userId);
        this.removeAssigns(userId);
        this.userSubscriptions.get(userId)?.();
        this.userSubscriptions.delete(userId);

        if (this.assignsCache.size === 0) {
            this.close();
        }

        return userData;
    }

    /**
     * @desc Returns the data of a user
     * @param userId - The id of the user
     */
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

    /**
     * @desc Sets the assigns of a user
     * @param userId - The id of the user
     * @param data - The assigns data
     */
    protected abstract setAssigns(userId: string, data: PondAssigns): void;

    /**
     * @desc Removes the assigns of a user
     * @param userId - The id of the user
     */
    protected abstract removeAssigns(userId: string): void;

    /**
     * @desc Processes presence data
     * @param action - The action to perform
     * @param userId - The id of the user
     * @param data - The presence data
     */
    protected processPresenceData (action: ActionTypes, userId: string, data: PondPresence | null): InternalChannelEvent {
        const current = data ? data : this.presenceCache.get(userId)!;

        this.#processData(this.presenceCache, DataTypes.PRESENCE, action, userId, data);

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

    /**
     * @desc Processes assigns data
     * @param action - The action to perform
     * @param userId - The id of the user
     * @param data - The assigns data
     */
    protected processAssignsData (action: ActionTypes, userId: string, data: PondAssigns | null) {
        this.#processData(this.assignsCache, DataTypes.ASSIGNS, action, userId, data);
    }

    #processData (cache: Map<string, PondObject>, dataType: DataTypes, action: ActionTypes, userId: string, data: PondObject | null) {
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

        if (data) {
            cache.set(userId, data);
        } else {
            cache.delete(userId);
        }
    }
}
