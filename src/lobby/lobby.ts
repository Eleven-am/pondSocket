import { Middleware } from '../abstracts/middleware';
import { ChannelEngine, ParentEngine } from '../channel/channel';
import { EventRequest } from '../channel/eventRequest';
import { EventResponse } from '../channel/eventResponse';
import { ServerActions, ChannelReceiver, SystemSender } from '../enums';
// eslint-disable-next-line import/no-unresolved
import { PondPath, PondMessage } from '../types';

export class LobbyEngine {
    readonly #channels: Set<ChannelEngine>;

    readonly #middleware: Middleware<EventRequest<string>, EventResponse>;

    constructor () {
        this.#channels = new Set<ChannelEngine>();
        this.#middleware = new Middleware();
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
            const channel = this.getChannel(channelName) || this.createChannel(channelName);

            channel.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.SYSTEM, event, payload);
        } else {
            this.#channels.forEach((channel) => {
                channel.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.SYSTEM, event, payload);
            });
        }
    }

    /**
     * @desc Removes a user from all channels
     * @param clientId - The client id of the user to remove
     * @param graceful - Whether to gracefully remove the user or not
     */
    public removeUser (clientId: string, graceful = false) {
        this.#channels.forEach((channel) => {
            channel.removeUser(clientId, graceful);
        });
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
     * @desc Lists all channels
     * @private
     */
    public listChannels () {
        return Array.from(this.#channels)
            .map((channel) => channel.name);
    }

    /**
     * @desc Creates a new channel
     * @param channelName - The name of the channel to create
     * @private
     */
    public createChannel (channelName: string): ChannelEngine {
        const destroyChannel = this.destroyChannel.bind(this, channelName);
        const execute = this.#middleware.run.bind(this.#middleware);

        const parentEngine: ParentEngine = {
            execute,
            destroyChannel,
        };

        const newChannel: ChannelEngine = new ChannelEngine(channelName, parentEngine);

        this.#channels.add(newChannel);

        return newChannel;
    }
}

export class PondChannel {
    readonly #lobby: LobbyEngine;

    constructor (lobby: LobbyEngine) {
        this.#lobby = lobby;
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
        this.#lobby.onEvent(event, handler);
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
        this.#lobby.broadcast(event, payload, channelName);
    }
}
