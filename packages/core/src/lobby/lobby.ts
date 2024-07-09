import {
    PondPath,
    UserData,
    PondMessage,
    ChannelReceiver,
    SystemSender,
    ServerActions,
} from '@eleven-am/pondsocket-common';

import { Middleware } from '../abstracts/middleware';
import { Channel, ChannelEngine } from '../channel/channel';
import { EventRequest } from '../channel/eventRequest';
import { EventResponse } from '../channel/eventResponse';
import { EndpointEngine } from '../endpoint/endpoint';
import { EndpointError } from '../errors/pondError';
import { parseAddress } from '../matcher/matcher';

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

    readonly #path: PondPath<string>;

    constructor (endpointEngine: EndpointEngine, path: PondPath<string>) {
        this.#parentEngine = endpointEngine;
        this.#channels = new Set<ChannelEngine>();
        this.#middleware = new Middleware();
        this.#path = path;
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
        const newChannel = new ChannelEngine(channelName, this);

        this.#channels.add(newChannel);

        return newChannel;
    }

    /**
     * @desc Sends a message to all clients in the channel
     * @param channelName - the name of the channel to send the message to
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcast (channelName: string, event: string, payload: PondMessage) {
        this.#performAction(channelName, (channel) => {
            channel.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, event, payload);
        });
    }

    /**
     * @desc Sends a message to all clients in the channel except the client making the request
     * @param channelName - the name of the channel to send the message to
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcastFrom (channelName: string, event: string, payload: PondMessage) {
        this.#performAction(channelName, (channel) => {
            channel.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, event, payload);
        });
    }

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param channelName - the name of the channel to send the message to
     * @param event - the event to send
     * @param payload - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public broadcastTo (channelName: string, event: string, payload: PondMessage, userIds: string | string[]) {
        const ids = Array.isArray(userIds) ? userIds : [userIds];

        this.#performAction(channelName, (channel) => {
            channel.sendMessage(SystemSender.CHANNEL, ids, ServerActions.BROADCAST, event, payload);
        });
    }

    #performAction (channelName: string, handler: (channel: ChannelEngine) => void) {
        const matches = parseAddress(this.#path, channelName);

        if (matches === null) {
            throw new EndpointError('Invalid channel name', 402);
        }

        const channel = this.getChannel(channelName) || this.createChannel(channelName);
        const assigns = channel.getAssigns();

        handler(channel);

        if (Object.keys(assigns).length === 0) {
            this.destroyChannel(channelName);
        }
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

    public broadcast (channelName: string, event: string, payload: PondMessage) {
        this.#lobby.broadcast(channelName, event, payload);
    }

    public broadcastFrom (channelName: string, event: string, payload: PondMessage) {
        this.#lobby.broadcastFrom(channelName, event, payload);
    }

    public broadcastTo (channelName: string, event: string, payload: PondMessage, userIds: string | string[]) {
        this.#lobby.broadcastTo(channelName, event, payload, userIds);
    }
}
