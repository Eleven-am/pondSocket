import { EventRequest } from './eventRequest';
import { EventResponse } from './eventResponse';
import { MiddlewareFunction } from '../abstracts/middleware';
import { SystemSender, ServerActions, ChannelReceiver, ErrorTypes } from '../enums';
import { ChannelError } from '../errors/pondError';
import { PresenceEngine } from '../presence/presence';
import { Subject } from '../subjects/subject';
import {
    PondMessage,
    PondAssigns,
    PondPresence,
    UserAssigns,
    ChannelEvent,
    ChannelReceivers,
    ClientMessage, UserData,
// eslint-disable-next-line import/no-unresolved
} from '../types';

type ChannelSenders = SystemSender.CHANNEL | string;

export type InternalChannelEvent = {
    sender: ChannelSenders;
    payload: PondMessage;
    event: string;
    recipients: string[];
    action: ServerActions;
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
            const code = 404;

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
            this.#presenceEngine?.removePresence(userId);

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
            message: 'You have been kicked out of the channel',
            reason,
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
            message: 'Channel has been destroyed',
            reason,
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
        const presence = this.#presenceEngine ? this.#presenceEngine.getUserPresence(userId) : {};

        if (this.#users.has(userId)) {
            return {
                id: userId,
                assigns: this.#users.get(userId)!,
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

        this.#receiver.publish({
            sender,
            recipients: this.#getUsersFromRecipients(recipient, sender),
            action,
            payload,
            event,
        });
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

        const responseEvent: InternalChannelEvent = {
            event: message.event,
            payload: message.payload,
            action: ServerActions.BROADCAST,
            sender: userId,
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
        this.#presenceEngine = this.#presenceEngine ?? new PresenceEngine(this.name);

        if (!this.#users.has(userId)) {
            throw new ChannelError(`ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`, 404, this.name);
        }

        this.#presenceEngine.trackPresence(userId, presence, (change) => {
            const { type, ...rest } = change;

            this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.PRESENCE, type, rest);
        });
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

    #subscribe (userId: string, onMessage: (event: ChannelEvent) => void) {
        this.#receiver.subscribeWith(userId, (event) => {
            if (event.recipients.includes(userId)) {
                onMessage({
                    action: event.action,
                    event: event.event,
                    payload: event.payload,
                    channelName: this.name,
                } as ChannelEvent);
            }
        });
    }

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
                const absentUsers = recipients.filter((user) => !allUsers.includes(user));

                if (absentUsers.length > 0) {
                    throw new ChannelError(`ChannelEngine: Users ${absentUsers.join(', ')} are not in channel ${this.name}`, 400, this.name);
                }

                users = recipients;
                break;
        }

        return users;
    }
}
