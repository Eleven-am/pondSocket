import { UserData } from '@eleven-am/pondsocket-common';

import { ChannelEngine, BroadcastEvent, Channel } from './channel';
import { AbstractRequest } from '../abstracts/abstractRequest';
import { ChannelError } from '../errors/pondError';

export class EventRequest<Path extends string> extends AbstractRequest<Path> {
    private readonly _internalEvent: BroadcastEvent;

    constructor (event: BroadcastEvent, engine: ChannelEngine) {
        super(event.event, engine, event.payload);
        this._internalEvent = event;
    }

    public get user (): UserData {
        const assigns = this._engine.getUserData(this._internalEvent.sender);

        if (!assigns) {
            const message = `ChannelRequest: User with id ${this._internalEvent.sender} does not exist in channel ${this._engine.name}`;
            const code = 404;

            throw new ChannelError(message, code, this._engine.name);
        }

        return assigns;
    }

    public get channel (): Channel {
        return new Channel(this._engine);
    }
}
