import { EventRequest } from './eventRequest';
import { EventResponse } from './eventResponse';
import { MiddlewareFunction } from '../abstracts/middleware';
import { SystemSender, ServerActions, ChannelReceiver, ErrorTypes } from '../enums';
import { ChannelError } from '../errors/pondError';
import { PresenceEngine } from '../presence/presence';
import { Subject } from '../subjects/subject';
import type {
    PondMessage,
    PondAssigns,
    PondPresence,
    UserAssigns,
    ChannelEvent,
    ChannelReceivers,
    ClientMessage,
    UserData,
} from '../types';

type ChannelSenders = SystemSender.CHANNEL | string;

export type InternalChannelEvent = ChannelEvent & {
    recipients: string[];
}

export type BroadcastEvent = Omit<InternalChannelEvent, 'action' | 'payload'> & {
    action: ServerActions.BROADCAST;
    sender: ChannelSenders;
    payload: PondMessage;
}

export type ParentEngine = {
    destroyChannel: () => void;
    execute: MiddlewareFunction<EventRequest<string>, EventResponse>;
}

export class ChannelEngine {
    public readonly name: string;

    readonly #receiver: Subject<InternalChannelEvent>;

    #presenceEngine: PresenceEngine | undefined;

    readonly #users: Map<string, PondAssigns>;

    readonly #parentEngine: ParentEngine;

    constructor (name: string, parent: ParentEngine) {
        this.name = name;
        this.#receiver = new Subject<InternalChannelEvent>();
        this.#users = new Map<string, PondAssigns>();
        this.#parentEngine = parent;
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

        return this.#subscribe(userId, onMessage);
    }

    /**
     * @desc Removes a user from the channel
     * @param userId - The id of the user to remove
     * @param graceful - Whether to remove the user gracefully or not
     */
    public removeUser (userId: string, graceful = false) {
        const user = this.#users.get(userId);

        if (user) {
            this.#users.delete(userId);
            this.#receiver.unsubscribe(userId);
            this.#presenceEngine?.removePresence(userId, graceful);

            if (this.#users.size === 0) {
                this.#parentEngine.destroyChannel();
            }
        } else if (!graceful) {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }
    }

    /**
     * @desc Kicks a user from the channel
     * @param userId - The id of the user to kick
     * @param reason - The reason for kicking the user
     */
    public kickUser (userId: string, reason: string) {
        this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.SYSTEM, 'kicked_out', {
            message: reason ?? 'You have been kicked out of the channel',
        });
        this.removeUser(userId);
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
        this.#parentEngine.destroyChannel();
        this.#users.forEach((_, userId) => this.#receiver.unsubscribe(userId));
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
     * @param sender - The sender of the message
     * @param recipient - The users to send the message to
     * @param action - The action of the message
     * @param event - The event name
     * @param payload - The payload of the message
     * @private
     */
    public sendMessage (sender: ChannelSenders, recipient: ChannelReceivers, action: ServerActions, event: string, payload: PondMessage) {
        if (!this.#users.has(sender) && sender !== SystemSender.CHANNEL) {
            throw new ChannelError(`ChannelEngine: User with id ${sender} does not exist in channel ${this.name}`, 404, this.name);
        }

        const eventMessage = {
            recipients: this.#getUsersFromRecipients(recipient, sender),
            channelName: this.name,
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
            recipients: this.#getUsersFromRecipients(message.addresses || ChannelReceiver.ALL_USERS, userId),
        };

        const request = new EventRequest(responseEvent, this);
        const response = new EventResponse(responseEvent, this);

        this.#parentEngine.execute(request, response, () => {
            this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.ERROR, ErrorTypes.HANDLER_NOT_FOUND, {
                message: 'A handler did not respond to the event',
                code: 404,
            });
        });
    }

    /**
     * @desc Begins tracking a user's presence
     * @param userId - The id of the user to track
     * @param presence - The initial presence of the user
     */
    public trackPresence (userId: string, presence: PondPresence) {
        if (!this.#users.has(userId)) {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }

        this.#presenceEngine = this.#presenceEngine ?? new PresenceEngine(this);
        this.#presenceEngine.trackPresence(userId, presence);
    }

    /**
     * @desc Gets the presence engine for the channel
     */
    public get presenceEngine () {
        return this.#presenceEngine;
    }

    /**
     * @desc Gets the number of users in the channel
     */
    public get size () {
        return this.#users.size;
    }

    /**
     * @desc Subscribes a user to the channel
     * @param userId - The id of the user to subscribe
     * @param onMessage - The callback to call when a message is received
     * @private
     */
    #subscribe (userId: string, onMessage: (event: ChannelEvent) => void) {
        this.#receiver.subscribeWith(userId, ({ recipients, ...event }) => {
            if (recipients.includes(userId)) {
                onMessage(event);
            }
        });
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
                if (!Array.isArray(recipients) || !recipients.every((recipient) => typeof recipient === 'string')) {
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
}

export class Client {
    #engine: ChannelEngine;

    constructor (engine: ChannelEngine) {
        this.#engine = engine;
    }

    public getAssigns () {
        return this.#engine.getAssigns();
    }

    public getUserData (userId: string) {
        return this.#engine.getUserData(userId);
    }

    public broadcastMessage (event: string, payload: PondMessage) {
        this.#engine.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, event, payload);
    }

    public sendToUser (userId: string, event: string, payload: PondMessage) {
        this.#engine.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.BROADCAST, event, payload);
    }

    public banUser (userId: string, reason?: string) {
        this.#engine.kickUser(userId, reason ?? 'You have been banned from the channel');
    }

    public trackPresence (userId: string, presence: PondPresence) {
        this.#engine.trackPresence(userId, presence);
    }

    public removePresence (userId: string) {
        this.#engine.presenceEngine?.removePresence(userId);
    }

    public updatePresence (userId: string, presence: PondPresence) {
        this.#engine.presenceEngine?.updatePresence(userId, presence);
    }
}
