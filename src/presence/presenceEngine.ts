import { BehaviorSubject } from '../utils/subjectUtils';

type PresenceEventTypes = 'join' | 'leave' | 'update';
export type PondPresence = Record<string, any>;

export interface PresenceEvent {
    type: PresenceEventTypes;
    changed: PondPresence;
    presence: PondPresence[];
}

export interface UserPresences {
    [userId: string]: PondPresence;
}

export class PresenceEngine {
    private readonly _presence: BehaviorSubject<PresenceEvent>;

    private readonly _presenceMap: Map<string, PondPresence>;

    constructor () {
        this._presence = new BehaviorSubject<PresenceEvent>();
        this._presenceMap = new Map<string, PondPresence>();
    }

    /**
     * @desc Lists all the presence of the users
     */
    public getPresence (): UserPresences {
        return Array.from(this._presenceMap.entries())
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
        return this._presenceMap.get(userId);
    }

    /**
     * @desc Removes a presence from the presence engine
     * @param presenceKey - The key of the presence
     */
    public removePresence (presenceKey: string) {
        const presence = this._presenceMap.get(presenceKey);

        if (presence) {
            this._presence.unsubscribe(presenceKey);
            this._presenceMap.delete(presenceKey);
            if (this._presenceMap.size > 0) {
                this._presence.next({
                    type: 'leave',
                    changed: presence,
                    presence: Array.from(this._presenceMap.values()),
                });
            }
        } else {
            throw new Error(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        }
    }

    /**
     * @desc Updates a presence
     * @param presenceKey - The key of the presence
     * @param presence - The new presence
     */
    public updatePresence (presenceKey: string, presence: PondPresence) {
        const oldPresence = this._presenceMap.get(presenceKey);

        if (oldPresence) {
            this._presenceMap.set(presenceKey, presence);
            this._presence.next({
                type: 'update',
                changed: { ...oldPresence,
                    ...presence },
                presence: Array.from(this._presenceMap.values()),
            });
        } else {
            throw new Error(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        }
    }

    /**
     * @desc Tracks a presence
     * @param presenceKey - The key of the presence
     * @param presence - The presence
     * @param onPresenceChange - The callback to be called when the presence changes
     */
    public trackPresence (presenceKey: string, presence: PondPresence, onPresenceChange: (presence: PresenceEvent) => void) {
        this._insertPresence(presenceKey, presence);

        return this._subscribe(presenceKey, onPresenceChange);
    }

    /**
     * @desc Inserts a presence into the presence engine
     * @param presenceKey - The key of the presence
     * @param presence - The presence
     * @private
     */
    private _insertPresence (presenceKey: string, presence: PondPresence) {
        if (!this._presenceMap.has(presenceKey)) {
            this._presenceMap.set(presenceKey, presence);
            this._presence.next({
                type: 'join',
                changed: presence,
                presence: Array.from(this._presenceMap.values()),
            });
        } else {
            throw new Error(`PresenceEngine: Presence with key ${presenceKey} already exists`);
        }
    }

    /**
     * @desc Subscribes to the presence engine
     * @param identifier - The identifier of the observer
     * @param observer - The observer
     * @private
     */
    private _subscribe (identifier: string, observer: (event: PresenceEvent) => void) {
        return this._presence.subscribe(identifier, observer);
    }
}
