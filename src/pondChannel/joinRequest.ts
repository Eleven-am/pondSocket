import { RequestCache } from './pondChannel';
import { AbstractRequest, EventObject } from '../abstracts/abstractRequest';
import { ChannelEngine, UserData } from '../channel/channelEngine';

export type JoinParams = Record<string, any>;

export class JoinRequest extends AbstractRequest {
    private readonly _requestCache: RequestCache;

    constructor (event: RequestCache, engine: ChannelEngine) {
        super(event.channelName, engine, event.joinParams);
        this._requestCache = event;
    }

    public get joinParams (): JoinParams {
        return this._requestCache.joinParams;
    }

    public get user (): UserData {
        return {
            id: this._requestCache.clientId,
            assigns: this._requestCache.assigns,
            presence: {},
        };
    }

    public get event (): EventObject {
        return {
            event: this._requestCache.channelName,
            params: this._requestCache.params,
            query: this._requestCache.query,
            payload: this._requestCache.joinParams,
        };
    }
}
