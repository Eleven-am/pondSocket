import { PondEvent, UserData, JoinParams } from '@eleven-am/pondsocket-common';

import { JoinRequestOptions } from '../abstracts/types';
import { ChannelEngine } from '../engines/channelEngine';
import { Channel } from '../wrappers/channel';

export class JoinRequest<Path extends string> {
    readonly #options: JoinRequestOptions<Path>;

    readonly #engine: ChannelEngine;

    constructor (options: JoinRequestOptions<Path>, channel: ChannelEngine) {
        this.#options = options;
        this.#engine = channel;
    }

    get event (): PondEvent<Path> {
        return {
            event: this.#engine.name,
            query: this.#options.params.query,
            params: this.#options.params.params,
            payload: this.#options.joinParams,
        };
    }

    get channelName (): string {
        return this.#engine.name;
    }

    get channel (): Channel {
        return new Channel(this.#engine);
    }

    get presences () {
        return this.#engine.getPresence();
    }

    get assigns () {
        return this.#engine.getAssigns();
    }

    get user (): UserData {
        return {
            id: this.#options.clientId,
            assigns: this.#options.assigns,
            presence: {},
        };
    }

    get joinParams (): JoinParams {
        return this.#options.joinParams;
    }
}
