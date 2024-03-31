import {
    ChannelEvent,
    ChannelReceiver,
    ChannelReceivers,
    ClientMessage,
    ErrorTypes,
    Events,
    PondAssigns,
    PondMessage,
    PondPresence,
    ServerActions,
    Subject,
    SystemSender,
    Unsubscribe,
    UserAssigns,
    UserData,
    uuid,
} from '@eleven-am/pondsocket-common';

import { EventRequest } from './eventRequest';
import { EventResponse } from './eventResponse';
import { ChannelError } from '../errors/pondError';
import { LobbyEngine } from '../lobby/lobby';
import { PresenceEngine } from '../presence/presence';

type ChannelSenders = SystemSender.CHANNEL | string;

export type InternalChannelEvent = ChannelEvent & {
    recipients: string[];
}

export type BroadcastEvent = Omit<InternalChannelEvent, 'action' | 'payload' | 'recipients'> & {
    action: ServerActions.BROADCAST;
    sender: ChannelSenders;
    payload: PondMessage;
}

export class ChannelEngine {
    public readonly name: string;

    readonly #receiver: Subject<InternalChannelEvent>;

    #presenceEngine: PresenceEngine | undefined;

    readonly #users: Map<string, PondAssigns>;

    readonly #parentEngine: LobbyEngine;

    constructor (name: string, parent: LobbyEngine) {
        this.name = name;
        this.#receiver = new Subject<InternalChannelEvent>();
        this.#users = new Map<string, PondAssigns>();
        this.#parentEngine = parent;
    }

    /**
     * @desc Gets the presence engine for the channel
     */
    public get presenceEngine (): PresenceEngine {
        const presenceEngine = this.#presenceEngine ?? new PresenceEngine(this);

        this.#presenceEngine = presenceEngine;

        return presenceEngine;
    }

    /**
     * @desc Gets the number of users in the channel
     */
    public get size () {
        return this.#users.size;
    }

    /**
     * @desc Gets the parent engine
     */
    public get parent () {
        return this.#parentEngine;
    }

    /**
     * @desc Adds a user to the channel
     * @param userId - The id of the user to add
     * @param assigns - The assigns to add to the user
     * @param onMessage - The callback to call when a message is received
     */
    public addUser (userId: string, assigns: PondAssigns, onMessage: (event: ChannelEvent) => void) {
        const oldUser = this.#users.get(userId);

        if (oldUser) {
            const message = `ChannelEngine: User with id ${userId} already exists in channel ${this.name}`;
            const code = 400;

            throw new ChannelError(message, code, this.name);
        }

        this.#users.set(userId, assigns);
        const subscription = this.#subscribe(userId, onMessage);

        this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.SYSTEM, Events.ACKNOWLEDGE, {});

        return subscription;
    }

    /**
     * @desc Kicks a user from the channel
     * @param userId - The id of the user to kick
     * @param reason - The reason for kicking the user
     */
    public kickUser (userId: string, reason: string) {
        this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.SYSTEM, 'kicked_out', {
            message: reason,
            code: 403,
        });
        this.#removeUser(userId);
        this.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.SYSTEM, 'kicked', {
            userId,
            reason,
        });
    }

    /**
     * @desc Self destructs the channel
     * @param reason - The reason for self-destructing the channel
     */
    public destroy (reason: string) {
        this.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.ERROR, 'destroyed', {
            message: reason ?? 'Channel has been destroyed',
        });
        this.#parentEngine.destroyChannel(this.name);
        this.#users.forEach((_, userId) => this.#removeUser(userId));
    }

    /**
     * @desc Updates a user's assigns
     * @param userId - The id of the user to update
     * @param assigns - The new assigns of the user
     */
    public updateAssigns (userId: string, assigns: PondAssigns) {
        const user = this.#users.get(userId);

        if (user) {
            this.#users.set(userId, {
                ...user,
                ...assigns,
            });
        } else {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }
    }

    /**
     * @desc Gets the data of a user
     * @param userId - The id of the user to get
     */
    public getUserData (userId: string): UserData | undefined {
        const assigns = this.#users.get(userId);
        const presence = this.#presenceEngine ? this.#presenceEngine.getUserPresence(userId) : {};

        if (assigns) {
            return {
                assigns,
                id: userId,
                presence: presence || {},
            };
        }

        return undefined;
    }

    /**
     * @desc Gets the assign data of all users
     */
    public getAssigns (): UserAssigns {
        const assigns: UserAssigns = {};

        this.#users.forEach((value, key) => {
            assigns[key] = value;
        });

        return assigns;
    }

    /**
     * @desc Sends a message to a specified set of users, from a specified sender
     * @param requestId - The id of the request
     * @param sender - The sender of the message
     * @param recipient - The users to send the message to
     * @param action - The action of the message
     * @param event - The event name
     * @param payload - The payload of the message
     */
    public sendMessage (sender: ChannelSenders, recipient: ChannelReceivers, action: ServerActions, event: string, payload: PondMessage, requestId: string = uuid()) {
        if (!this.#users.has(sender) && sender !== SystemSender.CHANNEL) {
            throw new ChannelError(`ChannelEngine: User with id ${sender} does not exist in channel ${this.name}`, 404, this.name);
        }

        const eventMessage = {
            recipients: this.#getUsersFromRecipients(recipient, sender),
            channelName: this.name,
            requestId,
            action,
            payload,
            event,
        } as InternalChannelEvent;

        this.#receiver.publish(eventMessage);
    }

    /**
     * @desc Handles a message from a user
     * @param userId - The id of the user who sent the message
     * @param message - The message received
     */
    public broadcastMessage (userId: string, message: ClientMessage) {
        if (!this.#users.has(userId)) {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }

        const responseEvent: BroadcastEvent = {
            sender: userId,
            event: message.event,
            payload: message.payload,
            action: ServerActions.BROADCAST,
            channelName: this.name,
            requestId: message.requestId,
        };

        const request = new EventRequest(responseEvent, this);
        const response = new EventResponse(responseEvent, this);

        this.#parentEngine.middleware.run(request, response, () => {
            this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.ERROR, ErrorTypes.HANDLER_NOT_FOUND, {
                message: 'A handler did not respond to the event',
                code: 404,
            }, message.requestId);
        });
    }

    /**
     * @desc Subscribes a user to a channel, Will join the channel if it exists or add to pending subscriptions
     * @param userId - The id of the user to subscribe
     * @param channel - The name of the channel to subscribe to
     */
    public subscribeTo (userId: string, channel: string) {
        this.#parentEngine.parent.subscribeTo(userId, channel);
    }

    /**
     * @desc Unsubscribes a user from a channel
     * @param userId - The id of the user to unsubscribe
     * @param channel - The name of the channel to unsubscribe from
     */
    public unsubscribeFrom (userId: string, channel: string) {
        this.#parentEngine.parent.unsubscribeFrom(userId, channel);
    }

    /**
     * @desc Subscribes a user to the channel
     * @param userId - The id of the user to subscribe
     * @param onMessage - The callback to call when a message is received
     * @private
     */
    #subscribe (userId: string, onMessage: (event: ChannelEvent) => void) {
        const unsubscribe = this.#receiver.subscribe(({ recipients, ...event }) => {
            if (recipients.includes(userId)) {
                onMessage(event);
            }
        });

        return this.#buildSubscription.bind(this, userId, unsubscribe) as Unsubscribe;
    }

    /**
     * @desc Gets the users from a set of recipients
     * @param recipients - The recipients to get the users from
     * @param sender - The sender of the message
     * @private
     */
    #getUsersFromRecipients (recipients: ChannelReceivers, sender: ChannelSenders): string[] {
        const allUsers = Array.from(this.#users.keys());
        let users: string[];

        switch (recipients) {
            case ChannelReceiver.ALL_USERS:
                users = allUsers;
                break;
            case ChannelReceiver.ALL_EXCEPT_SENDER:
                if (sender === SystemSender.CHANNEL) {
                    throw new ChannelError(`ChannelEngine: Cannot use ${ChannelReceiver.ALL_EXCEPT_SENDER} with ${SystemSender.CHANNEL}`, 500, this.name);
                }

                users = allUsers.filter((user) => user !== sender);
                break;
            default:
                if (!Array.isArray(recipients)) {
                    throw new ChannelError(`ChannelEngine: Invalid recipients ${recipients}`, 500, this.name);
                }

                if (recipients.some((user) => !allUsers.includes(user))) {
                    throw new ChannelError(`ChannelEngine: Invalid recipients ${recipients} some users do not exist in channel ${this.name}`, 500, this.name);
                }

                users = recipients;
                break;
        }

        return users;
    }

    /**
     * @desc Builds an unsubscribe function for a user to remove them from the channel
     * @param userId - The id of the user to remove
     * @param unsubscribe - The unsubscribe function to call
     * @private
     */
    #buildSubscription (userId: string, unsubscribe: Unsubscribe) {
        const user = this.#users.get(userId);

        if (!user) {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }

        unsubscribe();
        this.#users.delete(userId);
        const userPresence = this.#presenceEngine?.removePresence(userId);

        if (this.#parentEngine.leaveCallback) {
            this.#parentEngine.leaveCallback({
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                channel: new Channel(this),
                user: {
                    id: userId,
                    presence: userPresence ?? {},
                    assigns: user,
                },
            });
        }

        if (this.#users.size === 0) {
            this.#parentEngine.destroyChannel(this.name);
        }
    }

    /**
     * @desc Removes a user from the channel
     * @param userId - The id of the user to remove
     * @private
     */
    #removeUser (userId: string) {
        const cachedUser = this.#parentEngine.parent.getUser(userId);
        const unsubscribe = cachedUser.subscriptions.get(this.name);

        if (!unsubscribe) {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }

        unsubscribe();
        cachedUser.subscriptions.delete(this.name);
    }
}

export class Channel {
    #engine: ChannelEngine;

    constructor (engine: ChannelEngine) {
        this.#engine = engine;
    }

    get name () {
        return this.#engine.name;
    }

    public getAssigns () {
        return this.#engine.getAssigns();
    }

    public getPresences () {
        return this.#engine.presenceEngine.getPresence();
    }

    public getUserData (userId: string) {
        return this.#engine.getUserData(userId);
    }

    public broadcast (event: string, payload: PondMessage) {
        this.#engine.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, event, payload);
    }

    public broadcastFrom (userId: string, event: string, payload: PondMessage) {
        this.#engine.sendMessage(userId, ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, event, payload);
    }

    public broadcastTo (userIds: string | string[], event: string, payload: PondMessage) {
        const users = Array.isArray(userIds) ? userIds : [userIds];

        this.#engine.sendMessage(SystemSender.CHANNEL, users, ServerActions.BROADCAST, event, payload);
    }

    public evictUser (userId: string, reason?: string) {
        this.#engine.kickUser(userId, reason ?? 'You have been banned from the channel');
    }

    public trackPresence (userId: string, presence: PondPresence) {
        this.#engine.presenceEngine.trackPresence(userId, presence);
    }

    public removePresence (userId: string) {
        this.#engine.presenceEngine.removePresence(userId);
    }

    public updatePresence (userId: string, presence: PondPresence) {
        this.#engine.presenceEngine.updatePresence(userId, presence);
    }

    public subscribeTo (userId: string, channel: string) {
        this.#engine.subscribeTo(userId, channel);
    }

    public unsubscribeFrom (userId: string, channel: string) {
        this.#engine.unsubscribeFrom(userId, channel);
    }

    public upsertPresence (userId: string, presence: PondPresence) {
        const oldPresence = this.#engine.presenceEngine.getPresence()[userId];

        if (oldPresence) {
            this.#engine.presenceEngine.updatePresence(userId, presence);
        } else {
            this.#engine.presenceEngine.trackPresence(userId, presence);
        }
    }
}
