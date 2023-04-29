import { ChannelEngine } from '../channel/channel';
import { PresenceEventTypes, SystemSender, ChannelReceiver, ServerActions } from '../enums';
import { PresenceError } from '../errors/pondError';
// eslint-disable-next-line import/no-unresolved
import { PondPresence, UserPresences, PresencePayload } from '../types';

export class PresenceEngine {
    readonly #presenceMap: Map<string, PondPresence>;

    readonly #channel: ChannelEngine;

    constructor (channel: ChannelEngine) {
        this.#channel = channel;
        this.#presenceMap = new Map<string, PondPresence>();
    }

    /**
     * @desc Lists all the presence of the users
     */
    public getPresence (): UserPresences {
        return Array.from(this.#presenceMap.entries())
            .reduce((acc, [key, value]) => {
                acc[key] = value;

                return acc;
            }, {} as UserPresences);
    }

    /**
     * @desc Returns the presence of a user
     * @param userId - The id of the user
     */
    public getUserPresence (userId: string): PondPresence | undefined {
        return this.#presenceMap.get(userId);
    }

    /**
     * @desc Tracks a presence
     * @param presenceKey - The key of the presence
     * @param presence - The presence
     */
    public trackPresence (presenceKey: string, presence: PondPresence) {
        if (!this.#presenceMap.has(presenceKey)) {
            this.#presenceMap.set(presenceKey, presence);
            this.#publish(PresenceEventTypes.JOIN, {
                changed: presence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else {
            const code = 400;
            const message = `PresenceEngine: Presence with key ${presenceKey} already exists`;

            throw new PresenceError(message, code, this.#channel.name, PresenceEventTypes.JOIN);
        }
    }

    /**
     * @desc Removes a presence from the presence engine
     * @param presenceKey - The key of the presence
     * @param graceful - Whether to gracefully remove the presence
     */
    public removePresence (presenceKey: string, graceful = false) {
        const presence = this.#presenceMap.get(presenceKey);

        if (presence) {
            this.#presenceMap.delete(presenceKey);
            this.#publish(PresenceEventTypes.LEAVE, {
                changed: presence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else if (!graceful) {
            const code = 404;
            const message = `PresenceEngine: Presence with key ${presenceKey} does not exist`;

            throw new PresenceError(message, code, this.#channel.name, PresenceEventTypes.LEAVE);
        }
    }

    /**
     * @desc Updates a presence
     * @param presenceKey - The key of the presence
     * @param presence - The new presence
     */
    public updatePresence (presenceKey: string, presence: PondPresence) {
        const oldPresence = this.#presenceMap.get(presenceKey);

        if (oldPresence) {
            const newPresence = {
                ...oldPresence,
                ...presence,
            };

            this.#presenceMap.set(presenceKey, newPresence);
            this.#publish(PresenceEventTypes.UPDATE, {
                changed: newPresence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else {
            const code = 404;
            const message = `PresenceEngine: Presence with key ${presenceKey} does not exist`;

            throw new PresenceError(message, code, this.#channel.name, PresenceEventTypes.UPDATE);
        }
    }

    /**
     * @desc Publishes a presence event to all users in the channel
     * @param event - The event type
     * @param payload - The payload of the event
     * @private
     */
    #publish (event: PresenceEventTypes, payload: PresencePayload) {
        this.#channel.sendMessage(
            SystemSender.CHANNEL,
            ChannelReceiver.ALL_USERS,
            ServerActions.PRESENCE,
            event,
            payload,
        );
    }
}
