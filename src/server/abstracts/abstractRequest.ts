import { PondMessage } from './abstractResponse';
import { ChannelEngine, UserAssigns } from '../channel/channelEngine';
import { UserPresences } from '../presence/presenceEngine';
import { MatchPattern, PondPath, Resolver } from '../utils/matchPattern';

export interface EventObject {
    event: string;
    params: Record<string, string>;
    query: Record<string, string>;
    payload: PondMessage;
}

export class AbstractRequest {
    protected readonly _engine: ChannelEngine;

    private _eventObject: Resolver | null;

    private readonly _event: string;

    private readonly _payload: PondMessage;

    constructor (event: string, engine: ChannelEngine, payload: PondMessage) {
        this._engine = engine;
        this._event = event;
        this._eventObject = null;
        this._payload = payload;
    }

    public get event (): EventObject {
        return {
            event: this._event,
            params: this._eventObject?.params || {},
            query: this._eventObject?.query || {},
            payload: this._payload,
        };
    }

    public get channelNme (): string {
        return this._engine.name;
    }

    public get assigns (): UserAssigns {
        return this._engine.getAssigns();
    }

    public get presence (): UserPresences {
        return this._engine.getPresence();
    }

    /**
     * @desc Parses the event and returns true if the event matches the path
     * @param path - the path to match
     */
    public _parseQueries (path: PondPath): boolean {
        const match = new MatchPattern();

        this._eventObject = match.parseEvent(path, this._event);

        return this._eventObject !== null;
    }
}
