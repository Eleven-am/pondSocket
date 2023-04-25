import { PresenceEventTypes } from '../enums';
import { PresenceError } from '../errors/pondError';
import { BehaviorSubject } from '../subjects/subject';
// eslint-disable-next-line import/no-unresolved
import { PresenceEvent, PondPresence, UserPresences } from '../types';

export class PresenceEngine {
    readonly #engine: BehaviorSubject<PresenceEvent>;

    readonly #presenceMap: Map<string, PondPresence>;

    readonly #channel: string;

    constructor (channel: string) {
        this.#channel = channel;
        this.#engine = new BehaviorSubject<PresenceEvent>();
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
     * @param onPresenceChange - The callback to be called when the presence changes
     */
    public trackPresence (presenceKey: string, presence: PondPresence, onPresenceChange: (presence: PresenceEvent) => void) {
        if (!this.#presenceMap.has(presenceKey)) {
            this.#presenceMap.set(presenceKey, presence);
            this.#engine.publish({
                type: PresenceEventTypes.JOIN,
                changed: presence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else {
            const code = 404;
            const message = `PresenceEngine: Presence with key ${presenceKey} already exists`;

            throw new PresenceError(message, code, this.#channel, PresenceEventTypes.JOIN);
        }

        return this.#engine.subscribeWith(presenceKey, onPresenceChange);
    }

    /**
     * @desc Removes a presence from the presence engine
     * @param presenceKey - The key of the presence
     * @param graceful - Whether to gracefully remove the presence
     */
    public removePresence (presenceKey: string, graceful = false) {
        const presence = this.#presenceMap.get(presenceKey);

        if (presence) {
            this.#engine.unsubscribe(presenceKey);
            this.#presenceMap.delete(presenceKey);
            this.#engine.publish({
                type: PresenceEventTypes.LEAVE,
                changed: presence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else if (!graceful) {
            const code = 404;
            const message = `PresenceEngine: Presence with key ${presenceKey} does not exist`;

            throw new PresenceError(message, code, this.#channel, PresenceEventTypes.LEAVE);
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
            this.#engine.publish({
                type: PresenceEventTypes.UPDATE,
                changed: newPresence,
                presence: Array.from(this.#presenceMap.values()),
            });
        } else {
            const code = 404;
            const message = `PresenceEngine: Presence with key ${presenceKey} does not exist`;

            throw new PresenceError(message, code, this.#channel, PresenceEventTypes.UPDATE);
        }
    }
}
