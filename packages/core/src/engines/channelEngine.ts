import {
    ClientMessage,
    SystemSender,
    ServerActions,
    ErrorTypes,
    ChannelEvent,
    Events,
    ChannelReceivers,
    PondMessage,
    uuid,
    ChannelReceiver,
    PondPresence,
    UserAssigns,
    UserPresences,
    PondAssigns,
    Unsubscribe,
} from '@eleven-am/pondsocket-common';

import { LobbyEngine } from './lobbyEngine';
import { InternalChannelEvent, BroadcastEvent, ChannelSenders } from '../abstracts/types';
import { HttpError } from '../errors/httpError';
import { Manager } from '../managers/manager';
import { Channel } from '../wrappers/channel';

export class ChannelEngine {
    readonly #manager: Manager;

    constructor (public parent: LobbyEngine, public name: string, manager: Manager) {
        this.#manager = manager;
    }

    get users (): Set<string> {
        return this.#manager.userIds;
    }

    addUser (userId: string, assigns: PondAssigns, onMessage: (event: ChannelEvent) => void): Unsubscribe {
        if (this.users.has(userId)) {
            const message = `ChannelEngine: User with id ${userId} already exists in channel ${this.name}`;
            const code = 400;

            throw new HttpError(code, message);
        }

        this.#manager.addUser(userId, assigns, onMessage);
        this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.SYSTEM, Events.ACKNOWLEDGE, {});

        return this.removeUser.bind(this, userId);
    }

    sendMessage (sender: ChannelSenders, recipient: ChannelReceivers, action: ServerActions, event: string, payload: PondMessage, requestId: string = uuid()) {
        if (!this.users.has(sender) && sender !== SystemSender.CHANNEL) {
            const message = `ChannelEngine: User with id ${sender} does not exist in channel ${this.name}`;
            const code = 404;

            throw new HttpError(code, message);
        }

        const channelEvent = {
            channelName: this.name,
            requestId,
            action,
            event,
            payload,
        } as ChannelEvent;

        const recipients = this.#getUsersFromRecipients(recipient, sender);

        const internalEvent: InternalChannelEvent = {
            ...channelEvent,
            recipients,
        };

        this.#manager.broadcast(internalEvent);
    }

    broadcastMessage (userId: string, message: ClientMessage) {
        if (!this.users.has(userId)) {
            const message = `ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`;
            const code = 404;

            throw new HttpError(code, message);
        }

        const responseEvent: BroadcastEvent = {
            ...message,
            sender: userId,
            action: ServerActions.BROADCAST,
        };

        this.parent.middleware.run(responseEvent, this, (error) => {
            this.sendMessage(
                SystemSender.CHANNEL,
                [userId],
                ServerActions.ERROR,
                ErrorTypes.HANDLER_NOT_FOUND,
                {
                    message: error?.message || 'A handler did not respond to the event',
                    code: error?.statusCode || 500,
                },
                message.requestId,
            );
        });
    }

    trackPresence (userId: string, presence: PondPresence) {
        return this.#manager.trackPresence(userId, presence);
    }

    updatePresence (userId: string, presence: PondPresence) {
        return this.#manager.updatePresence(userId, presence);
    }

    removePresence (userId: string) {
        return this.#manager.removePresence(userId);
    }

    upsertPresence (userId: string, presence: PondPresence) {
        return this.#manager.upsertPresence(userId, presence);
    }

    updateAssigns (userId: string, assigns: PondMessage) {
        return this.#manager.updateAssigns(userId, assigns);
    }

    kickUser (userId: string, reason: string) {
        this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.SYSTEM, 'kicked_out', {
            message: reason,
            code: 403,
        });
        this.removeUser(userId);
        this.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.SYSTEM, 'kicked', {
            userId,
            reason,
        });
    }

    getAssigns (): UserAssigns {
        return Array
            .from(this.#manager.getAllAssigns().entries())
            .reduce((acc, [id, assigns]) => {
                acc[id] = assigns;

                return acc;
            }, {} as UserAssigns);
    }

    getPresence (): UserPresences {
        return Array
            .from(this.#manager.getAllPresence().entries())
            .reduce((acc, [id, presence]) => {
                acc[id] = presence;

                return acc;
            }, {} as UserPresences);
    }

    destroy (reason?: string) {
        this.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.ERROR, 'destroyed', {
            message: reason ?? 'Channel has been destroyed',
        });
        this.#manager.close();
    }

    removeUser (userId: string) {
        const userData = this.#manager.removeUser(userId);

        if (this.parent.leaveCallback) {
            this.parent.leaveCallback({
                user: userData,
                channel: new Channel(this),
            });
        }
    }

    getUser (userId: string) {
        return this.#manager.getUserData(userId);
    }

    #getUsersFromRecipients (recipients: ChannelReceivers, sender: ChannelSenders): string[] {
        const allUsers = Array.from(this.users);
        let users: string[];

        switch (recipients) {
            case ChannelReceiver.ALL_USERS:
                users = allUsers;
                break;
            case ChannelReceiver.ALL_EXCEPT_SENDER:
                if (sender === SystemSender.CHANNEL) {
                    const message = `ChannelEngine: Invalid sender ${sender} for recipients ${recipients}`;
                    const code = 400;

                    throw new HttpError(code, message);
                }

                users = allUsers.filter((user) => user !== sender);
                break;
            default:
                if (!Array.isArray(recipients)) {
                    const message = `ChannelEngine: Invalid recipients ${recipients} must be an array of user ids or ${ChannelReceiver.ALL_USERS}`;
                    const code = 400;

                    throw new HttpError(code, message);
                }

                if (recipients.some((user) => !allUsers.includes(user))) {
                    const message = `ChannelEngine: Invalid user ids in recipients ${recipients}`;
                    const code = 400;

                    throw new HttpError(code, message);
                }

                users = recipients;
                break;
        }

        return users;
    }
}
