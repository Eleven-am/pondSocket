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

    /**
     * The event information
     */
    get event (): PondEvent<Path> {
        return {
            event: this.#event.event,
            query: this.#params.query,
            params: this.#params.params,
            payload: this.#event.payload,
        };
    }

    /**
     * The channel name
     */
    get channelName (): string {
        return this.#engine.name;
    }

    /**
     * The channel instance
     */
    get channel (): Channel {
        return new Channel(this.#engine);
    }

    /**
     * All current presences in the channel
     */
    get presences () {
        return this.#engine.getPresence();
    }

    /**
     * All current assigns in the channel
     */
    get assigns () {
        return this.#engine.getAssigns();
    }

    /**
     * The user who sent the request
     */
    get user () {
        return this.#engine.getUserData(this.#event.sender);
    }
}
