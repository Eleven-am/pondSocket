import { PondPath, PondMessage } from '@eleven-am/pondsocket-common';

import { Channel } from './channel';
import { LeaveCallback, EventHandler } from '../abstracts/types';
import { LobbyEngine } from '../engines/lobbyEngine';

export class PondChannel {
    readonly #lobby: LobbyEngine;

    constructor (lobby: LobbyEngine) {
        this.#lobby = lobby;
    }

    public onEvent<Event extends string> (event: PondPath<Event>, handler: EventHandler<Event>): PondChannel {
        this.#lobby.onEvent(event, handler);

        return this;
    }

    public onLeave (callback: LeaveCallback): PondChannel {
        this.#lobby.onLeave(callback);

        return this;
    }

    public getChannel (channelName: string) {
        const channel = this.#lobby.getChannel(channelName);

        return new Channel(channel);
    }

    public broadcast (channelName: string, event: string, payload: PondMessage): PondChannel {
        this.getChannel(channelName).broadcast(event, payload);

        return this;
    }

    public broadcastFrom (channelName: string, userId: string, event: string, payload: PondMessage): PondChannel {
        this.getChannel(channelName).broadcastFrom(userId, event, payload);

        return this;
    }

    public broadcastTo (channelName: string, userIds: string | string[], event: string, payload: PondMessage): PondChannel {
        this.getChannel(channelName).broadcastTo(userIds, event, payload);

        return this;
    }
}