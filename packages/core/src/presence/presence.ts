import {
    PondPresence,
    PresenceEventTypes,
    PresencePayload,
    ServerActions,
    SystemSender,
    UserPresences,
} from '@eleven-am/pondsocket-common';

import { ChannelEngine } from '../channel/channel';
import { PresenceError } from '../errors/pondError';

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
     * @param safe - If true, it will not throw an error if the presence does not exist
     */
    public removePresence (presenceKey: string, safe = false) {
        const presence = this.#presenceMap.get(presenceKey);

        if (presence) {
            this.#presenceMap.delete(presenceKey);
            this.#publish(PresenceEventTypes.LEAVE, {
                changed: presence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else if (!safe) {
            const code = 404;
            const message = `PresenceEngine: Presence with key ${presenceKey} does not exist`;

            throw new PresenceError(message, code, this.#channel.name, PresenceEventTypes.LEAVE);
        }

        return presence;
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
        const recipients = Array.from(this.#presenceMap.keys());

        if (recipients.length === 0) {
            return;
        }

        this.#channel.sendMessage(
            SystemSender.CHANNEL,
            recipients,
            ServerActions.PRESENCE,
            event,
            payload as unknown as Record<string, any>,
        );
    }
}
