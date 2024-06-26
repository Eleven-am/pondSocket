import { JoinParams, PondAssigns, UserData } from '@eleven-am/pondsocket-common';

import { AbstractRequest } from '../abstracts/abstractRequest';
import { Channel, ChannelEngine } from '../channel/channel';
import { RequestCache } from '../endpoint/endpoint';

export class JoinRequest<Path extends string> extends AbstractRequest<Path> {
    readonly #params: JoinParams;

    readonly #clientId: string;

    readonly #assigns: PondAssigns;

    constructor (event: RequestCache, params: JoinParams, engine: ChannelEngine) {
        super(engine.name, engine, params);
        this.#params = params;
        this.#clientId = event.clientId;
        this.#assigns = event.assigns;
    }

    public get joinParams (): JoinParams {
        return this.#params;
    }

    public get user (): UserData {
        return {
            id: this.#clientId,
            assigns: this.#assigns,
            presence: {},
        };
    }

    public get channel (): Channel {
        return new Channel(this._engine);
    }
}
