import { PondPath, UserData } from '@eleven-am/pondsocket-common';

import { Middleware } from '../abstracts/middleware';
import { Channel, ChannelEngine } from '../channel/channel';
import { EventRequest } from '../channel/eventRequest';
import { EventResponse } from '../channel/eventResponse';
import { EndpointEngine } from '../endpoint/endpoint';

export interface LeaveEvent {
    user: UserData;
    channel: Channel;
}

export type LeaveCallback = (event: LeaveEvent) => void;

export class LobbyEngine {
    readonly #channels: Set<ChannelEngine>;

    readonly #middleware: Middleware<EventRequest<string>, EventResponse>;

    #leaveCallback: LeaveCallback | undefined;

    readonly #parentEngine: EndpointEngine;

    constructor (endpointEngine: EndpointEngine) {
        this.#parentEngine = endpointEngine;
        this.#channels = new Set<ChannelEngine>();
        this.#middleware = new Middleware();
    }

    /**
     * @desc The parent engine
     */
    get parent () {
        return this.#parentEngine;
    }

    /**
     * @desc The leave callback
     */
    get leaveCallback () {
        return this.#leaveCallback;
    }

    /**
     * @desc The middleware to use
     */
    get middleware () {
        return this.#middleware;
    }

    /**
     * @desc Handles an event request made by a user
     * @param event - The event to listen for
     * @param handler - The handler to execute when the event is received
     * @example
     * pond.onEvent('echo', (request, response) => {
     *     response.send('echo', {
     *         message: request.event.payload,
     *     });
     * });
     */
    public onEvent<Event extends string> (event: PondPath<Event>, handler: (request: EventRequest<Event>, response: EventResponse) => void | Promise<void>) {
        this.#middleware.use((request, response, next) => {
            if (request._parseQueries(event)) {
                return handler(request as EventRequest<Event>, response);
            }

            next();
        });
    }

    /**
     * @desc Handles the leave event for a user, can occur when a user disconnects or leaves a channel, use this to clean up any resources
     * @param callback - The callback to execute when a user leaves
     */
    public onLeave (callback: LeaveCallback) {
        this.#leaveCallback = callback;
    }

    /**
     * @desc Gets a channel by name
     * @param channelName - The name of the channel to get
     * @private
     */
    public getChannel (channelName: string): ChannelEngine | undefined {
        return Array.from(this.#channels)
            .find((channel) => channel.name === channelName);
    }

    /**
     * @desc Destroys a channel
     * @param channel - The name of the channel to destroy
     * @private
     */
    public destroyChannel (channel: string) {
        const newChannel = this.getChannel(channel);

        if (newChannel) {
            this.#channels.delete(newChannel);
        }
    }

    /**
     * @desc Creates a new channel
     * @param channelName - The name of the channel to create
     * @private
     */
    public createChannel (channelName: string): ChannelEngine {
        const newChannel: ChannelEngine = new ChannelEngine(channelName, this);

        this.#channels.add(newChannel);

        return newChannel;
    }
}

export class PondChannel {
    readonly #lobby: LobbyEngine;

    constructor (lobby: LobbyEngine) {
        this.#lobby = lobby;
    }

    public onEvent<Event extends string> (event: PondPath<Event>, handler: (request: EventRequest<Event>, response: EventResponse) => void | Promise<void>) {
        this.#lobby.onEvent(event, handler);
    }

    public onLeave (callback: LeaveCallback) {
        this.#lobby.onLeave(callback);
    }

    public getChannel (channelName: string): Channel | null {
        const channel = this.#lobby.getChannel(channelName);

        if (channel) {
            return new Channel(channel);
        }

        return null;
    }
}
