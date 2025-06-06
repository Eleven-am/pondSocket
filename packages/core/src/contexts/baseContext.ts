import { EventParams, PondEvent, PondMessage, UserPresences, UserAssigns } from '@eleven-am/pondsocket-common';

import { ChannelEngine } from '../engines/channelEngine';
import { Channel } from '../wrappers/channel';

export class BaseContext<Path extends string> {
    readonly #engine: ChannelEngine;

    readonly #params: EventParams<Path>;

    readonly #event: string;

    readonly #payload: PondMessage;

    constructor (
        engine: ChannelEngine,
        params: EventParams<Path>,
        event: string,
        payload: PondMessage,
    ) {
        this.#engine = engine;
        this.#params = params;
        this.#event = event;
        this.#payload = payload;
    }

    /**
     * The event information
     */
    get event (): PondEvent<Path> {
        return {
            event: this.#event,
            query: this.#params.query,
            params: this.#params.params,
            payload: this.#payload,
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
    get presences (): UserPresences {
        return this.#engine.getPresence();
    }

    /**
     * All current assigns in the channel
     */
    get assigns (): UserAssigns {
        return this.#engine.getAssigns();
    }

    /**
     * Gets the channel engine instance
     * @protected
     */
    protected get engine (): ChannelEngine {
        return this.#engine;
    }
}
