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
    Subject,
    UserData,
} from '@eleven-am/pondsocket-common';

import { LobbyEngine } from './lobbyEngine';
import { PresenceEngine } from './presenceEngine';
import { ChannelSenders, BroadcastEvent, InternalChannelEvent } from '../abstracts/types';
import { HttpError } from '../errors/httpError';


export class ChannelEngine {
    #presenceEngine: PresenceEngine | null = null;

    #assignsCache: Map<string, PondAssigns> = new Map();

    #userSubscriptions: Map<string, Unsubscribe> = new Map();

    #publisher: Subject<InternalChannelEvent> = new Subject();

    readonly #name: string;

    constructor (public parent: LobbyEngine, name: string) {
        this.#name = name;
    }

    get name (): string {
        return this.#name;
    }

    get users (): Set<string> {
        return new Set(this.#assignsCache.keys());
    }

    /**
     * Adds a user to the channel
     * @param userId - The user ID
     * @param assigns - The user's assigns
     * @param onMessage - Callback for messages
     * @returns Unsubscribe function
     */
    addUser (userId: string, assigns: PondAssigns, onMessage: (event: ChannelEvent) => void): Unsubscribe {
        if (this.users.has(userId)) {
            const message = `ChannelEngine: User with id ${userId} already exists in channel ${this.name}`;

            throw new HttpError(400, message);
        }

        // Store user assigns
        this.#assignsCache.set(userId, assigns);

        // Subscribe user to messages
        this.#buildSubscriber(userId, onMessage);

        // Send acknowledgment
        this.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.SYSTEM, Events.ACKNOWLEDGE, {});

        // Return unsubscribe function
        return () => this.removeUser(userId);
    }

    /**
     * Sends a message to recipients
     */
    sendMessage (
        sender: ChannelSenders,
        recipient: ChannelReceivers,
        action: ServerActions,
        event: string,
        payload: PondMessage,
        requestId: string = uuid(),
    ): void {
        if (!this.users.has(sender as string) && sender !== SystemSender.CHANNEL) {
            const message = `ChannelEngine: User with id ${sender} does not exist in channel ${this.name}`;

            throw new HttpError(404, message);
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

        this.#publisher.publish(internalEvent);
    }

    /**
     * Broadcasts a message from a user
     */
    broadcastMessage (userId: string, message: ClientMessage): void {
        if (!this.users.has(userId)) {
            const message = `ChannelEngine: User with id ${userId} does not exist in channel ${this.name}`;

            throw new HttpError(404, message);
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

    /**
     * Tracks a user's presence
     */
    trackPresence (userId: string, presence: PondPresence): void {
        const presenceEngine = this.#getOrCreatePresenceEngine();

        presenceEngine.trackPresence(userId, presence);
    }

    /**
     * Updates a user's presence
     */
    updatePresence (userId: string, presence: PondPresence): void {
        const presenceEngine = this.#getOrCreatePresenceEngine();

        presenceEngine.updatePresence(userId, presence);
    }

    /**
     * Removes a user's presence
     */
    removePresence (userId: string): void {
        if (this.#presenceEngine) {
            this.#presenceEngine.removePresence(userId);
        }
    }

    /**
     * Adds or updates a user's presence
     */
    upsertPresence (userId: string, presence: PondPresence): void {
        const presenceEngine = this.#getOrCreatePresenceEngine();

        presenceEngine.upsertPresence(userId, presence);
    }

    /**
     * Updates a user's assigns
     */
    updateAssigns (userId: string, assigns: PondMessage): void {
        if (!this.#assignsCache.has(userId)) {
            throw new HttpError(404, `User with id ${userId} does not exist in channel ${this.name}`);
        }

        const currentAssigns = this.#assignsCache.get(userId) || {};

        this.#assignsCache.set(userId, {
            ...currentAssigns,
            ...assigns,
        });
    }

    /**
     * Kicks a user from the channel
     */
    kickUser (userId: string, reason: string): void {
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

    /**
     * Gets all assigns as an object
     */
    getAssigns (): UserAssigns {
        return Array
            .from(this.#assignsCache.entries())
            .reduce((acc, [id, assigns]) => {
                acc[id] = assigns;

                return acc;
            }, {} as UserAssigns);
    }

    /**
     * Gets all presence data as an object
     */
    getPresence (): UserPresences {
        if (!this.#presenceEngine) {
            return {};
        }

        return Array
            .from(this.#presenceEngine.getAllPresence().entries())
            .reduce((acc, [id, presence]) => {
                acc[id] = presence;

                return acc;
            }, {} as UserPresences);
    }

    /**
     * Destroys the channel
     */
    destroy (reason?: string): void {
        this.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.ERROR, 'destroyed', {
            message: reason ?? 'Channel has been destroyed',
        });

        this.close();
    }

    /**
     * Removes a user from the channel
     */
    removeUser (userId: string): void {
        try {
            const userData = this.getUserData(userId);
            const unsubscribe = this.#userSubscriptions.get(userId);

            this.#assignsCache.delete(userId);
            if (this.#presenceEngine) {
                this.#presenceEngine.removePresence(userId);
            }

            if (unsubscribe) {
                unsubscribe();
                this.#userSubscriptions.delete(userId);
            }

            // Trigger leave callback if defined
            if (this.parent.leaveCallback) {
                this.parent.leaveCallback({
                    user: userData,
                    channel: this.parent.wrapChannel(this),
                });
            }

            // If no users left, close the channel
            if (this.users.size === 0) {
                this.close();
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    /**
     * Gets user data by ID
     */
    getUserData (userId: string): UserData {
        const assigns = this.#assignsCache.get(userId);
        const presence = this.#presenceEngine?.getPresence(userId) || null;

        if (!assigns && !presence) {
            const message = `User with id ${userId} does not exist in the channel ${this.name}`;

            throw new HttpError(404, message);
        }

        return {
            assigns: assigns || {},
            presence: presence || {},
            id: userId,
        };
    }

    /**
     * Closes the channel and cleans up resources
     */
    close (): void {
        // Clear all user subscriptions
        this.#userSubscriptions.forEach((unsubscribe) => unsubscribe());
        this.#userSubscriptions.clear();

        // Clear assigns
        this.#assignsCache.clear();

        // Close presence engine if exists
        if (this.#presenceEngine) {
            this.#presenceEngine.close();
            this.#presenceEngine = null;
        }

        // Close publisher
        this.#publisher.close();

        // Remove the channel from the parent
        this.parent.deleteChannel(this.name);
    }

    /**
     * Builds a subscriber for a user
     */
    #buildSubscriber (userId: string, onMessage: (event: ChannelEvent) => void): void {
        const subscription = this.#publisher.subscribe(async ({ recipients, ...event }) => {
            if (recipients.includes(userId)) {
                if (event.action === ServerActions.SYSTEM) {
                    return onMessage(event);
                }

                const newEvent = await this.parent.manageOutgoingEvents(event, userId, this);

                if (newEvent) {
                    onMessage(newEvent);
                }
            }
        });

        this.#userSubscriptions.set(userId, subscription);
    }

    /**
     * Gets or creates the presence engine
     */
    #getOrCreatePresenceEngine (): PresenceEngine {
        if (!this.#presenceEngine) {
            this.#presenceEngine = new PresenceEngine(this.name);

            // Subscribe to presence events and publish them through the channel publisher
            this.#presenceEngine.subscribe((event) => {
                this.#publisher.publish(event);
            });
        }

        return this.#presenceEngine;
    }

    /**
     * Gets users from recipient's specification
     */
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

                    throw new HttpError(400, message);
                }
                users = allUsers.filter((user) => user !== sender);
                break;

            default:
                if (!Array.isArray(recipients)) {
                    const message = `ChannelEngine: Invalid recipients ${recipients} must be an array of user ids or ${ChannelReceiver.ALL_USERS}`;

                    throw new HttpError(400, message);
                }

                if (recipients.some((user) => !allUsers.includes(user))) {
                    const message = `ChannelEngine: Invalid user ids in recipients ${recipients}`;

                    throw new HttpError(400, message);
                }

                users = recipients;
                break;
        }

        return users;
    }
}
