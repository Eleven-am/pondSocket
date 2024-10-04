import { PondPath } from '@eleven-am/pondsocket-common';

import { ChannelEngine } from './channelEngine';
import { EndpointEngine } from './endpointEngine';
import { Middleware } from '../abstracts/middleware';
import { EventHandler, BroadcastEvent, LeaveCallback } from '../abstracts/types';
import { HttpError } from '../errors/httpError';
import { parseAddress } from '../matcher/matcher';
import { EventRequest } from '../requests/eventRequest';
import { EventResponse } from '../responses/eventResponse';


export class LobbyEngine {
    readonly middleware: Middleware<BroadcastEvent, ChannelEngine>;

    leaveCallback: LeaveCallback | undefined;

    readonly #channels: Map<string, ChannelEngine>;

    constructor (public parent: EndpointEngine) {
        this.middleware = new Middleware();
        this.#channels = new Map();
    }

    onLeave (callback: LeaveCallback) {
        this.leaveCallback = callback;
    }

    onEvent<Event extends string> (event: PondPath<Event>, handler: EventHandler<Event>) {
        this.middleware.use((requestEvent, channel, next) => {
            const params = parseAddress(event, requestEvent.event);

            if (params) {
                const eventRequest = new EventRequest(requestEvent, params, channel);
                const response = new EventResponse(requestEvent, channel);

                return handler(eventRequest, response, next);
            }

            return next();
        });
    }

    getOrCreateChannel (channelName: string) {
        const oldChannel = this.#getChannel(channelName);

        if (oldChannel) {
            return oldChannel;
        }

        return this.#createChannel(channelName);
    }

    getChannel (channelName: string): ChannelEngine {
        const channel = this.#channels.get(channelName);

        if (!channel) {
            throw new HttpError(404, `Channel ${channelName} not found`);
        }

        return channel;
    }

    #getChannel (channelName: string): ChannelEngine | null {
        return this.#channels.get(channelName) || null;
    }

    #createChannel (channelName: string) {
        const onManagerClose = this.#channels.delete.bind(this.#channels, channelName);
        const manager = this.parent.createManager(channelName, onManagerClose);
        const channel = new ChannelEngine(this, channelName, manager);

        this.#channels.set(channelName, channel);

        return channel;
    }
}
