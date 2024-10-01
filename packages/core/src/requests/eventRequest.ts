import { EventParams, PondEvent } from '@eleven-am/pondsocket-common';

import { BroadcastEvent } from '../abstracts/types';
import { ChannelEngine } from '../engines/channelEngine';
import { Channel } from '../wrappers/channel';

export class EventRequest<Path extends string> {
    readonly #event: BroadcastEvent;

    readonly #engine: ChannelEngine;

    readonly #params: EventParams<Path>;

    constructor (event: BroadcastEvent, params: EventParams<Path>, engine: ChannelEngine) {
        this.#event = event;
        this.#params = params;
        this.#engine = engine;
    }

    get event (): PondEvent<Path> {
        return {
            event: this.#event.event,
            query: this.#params.query,
            params: this.#params.params,
            payload: this.#event.payload,
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

    get user () {
        return this.#engine.getUser(this.#event.sender);
    }
}
