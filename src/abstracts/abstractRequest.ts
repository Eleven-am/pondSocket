import { ChannelEngine } from '../channel/channel';
import { parseAddress } from '../matcher/matcher';
import type { PondMessage, UserPresences, UserAssigns, PondPath, PondEvent, EventParams } from '../types';

export class AbstractRequest<Path extends string> {
    protected readonly _engine: ChannelEngine;

    #eventObject: EventParams<Path> | null;

    readonly #event: string;

    readonly #payload: PondMessage;

    constructor (event: string, engine: ChannelEngine, payload: PondMessage) {
        this._engine = engine;
        this.#event = event;
        this.#eventObject = null;
        this.#payload = payload;
    }

    public get event (): PondEvent<Path> {
        if (this.#eventObject === null) {
            throw new Error('Event was not parsed');
        }

        return {
            event: this.#event,
            params: this.#eventObject.params || {},
            query: this.#eventObject.query || {},
            payload: this.#payload,
        };
    }

    public get channelName (): string {
        return this._engine.name;
    }

    public get assigns (): UserAssigns {
        return this._engine.getAssigns();
    }

    public get presence (): UserPresences {
        return this._engine.presenceEngine?.getPresence() || {};
    }

    /**
     * @desc Parses the event and returns true if the event matches the path
     * @param path - the path to match
     */
    public _parseQueries (path: PondPath<Path>): boolean {
        this.#eventObject = parseAddress(path, this.#event);

        return this.#eventObject !== null;
    }
}
