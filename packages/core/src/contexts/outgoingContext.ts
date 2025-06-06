import { ChannelEvent, EventParams } from '@eleven-am/pondsocket-common';

import { BaseContext } from './baseContext';
import { ChannelEngine } from '../engines/channelEngine';


export class OutgoingContext<Path extends string> extends BaseContext<Path> {
    readonly #event: ChannelEvent;

    readonly #userId: string;

    constructor (event: ChannelEvent, params: EventParams<Path>, engine: ChannelEngine, userId: string) {
        super(engine, params, event.event, event.payload);
        this.#event = event;
        this.#userId = userId;
    }
}
