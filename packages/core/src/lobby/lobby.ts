import {
    ChannelReceiver,
    PondMessage,
    PondPath,
    ServerActions,
    SystemSender,
    UserData,
} from '@eleven-am/pondsocket-common';

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
     * @desc Broadcasts a message to all users in a channel
     * @param event - The event to broadcast
     * @param payload - The payload to send
     * @param channelName - The channel to broadcast to (if not specified, broadcast to all channels)
     * @example
     * pond.broadcast('echo', {
     *    message: 'Hello World',
     *    timestamp: Date.now(),
     *    channel: 'my_channel',
     *});
     */
    public broadcast (event: string, payload: PondMessage, channelName?: string) {
        if (channelName) {
            const channel = this.getChannel(channelName);

            if (!channel) {
                throw new Error(`GatewayEngine: Channel ${channelName} does not exist`);
            }

            channel.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.SYSTEM, event, payload);
        } else {
            this.#channels.forEach((channel) => {
                channel.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.SYSTEM, event, payload);
            });
        }
    }

    /**
     * @desc Executes a function on a channel
     * @param channelName - The name of the channel to execute the function on
     * @param handler - The function to execute
     * @private
     */
    public execute<Return> (channelName: string, handler: ((channel: ChannelEngine) => Return)) {
        const newChannel = this.getChannel(channelName);

        if (newChannel) {
            return handler(newChannel);
        }

        throw new Error(`GatewayEngine: Channel ${channelName} does not exist`);
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

    public broadcast (event: string, payload: PondMessage, channelName?: string) {
        this.#lobby.broadcast(event, payload, channelName);
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
