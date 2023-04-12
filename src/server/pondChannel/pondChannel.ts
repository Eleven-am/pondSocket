import { WebSocket } from 'ws';

import { JoinRequest } from './joinRequest';
import { JoinResponse } from './joinResponse';
import { Middleware } from '../abstracts/middleware';
import { ChannelEngine, ParentEngine, PondAssigns } from '../channel/channelEngine';
import { EventRequest } from '../channel/eventRequest';
import { EventResponse } from '../channel/eventResponse';
import { PondPath } from '../utils/matchPattern';

export type AuthorizeMiddleware = (request: JoinRequest, response: JoinResponse) => void | Promise<void>;

export interface RequestCache {
    clientId: string;
    socket: WebSocket;
    channelName: string;
    assigns: PondAssigns;
    joinParams: Record<string, any>;
    params: Record<string, string>;
    query: Record<string, string>;
}

export type SocketCache = Pick<RequestCache, 'socket' | 'clientId' | 'assigns'>;

export interface PondChannelManager {
    listChannels: () => string[];
    getChannels: () => ChannelEngine[];
    removeUser: (clientId: string) => void;
    addUser: (request: RequestCache) => void;
    execute: <A>(channelName: string, handler: ((channel: ChannelEngine) => A)) => A;
}

export class PondChannel {
    private _authorize: AuthorizeMiddleware | undefined;

    private readonly _channels: Set<ChannelEngine>;

    private readonly _middleware: Middleware<EventRequest, EventResponse>;

    constructor () {
        this._authorize = undefined;
        this._channels = new Set<ChannelEngine>();
        this._middleware = new Middleware();
    }

    /**
     * @desc Authorize a user to join a channel
     * @param handler - The handler to authorize the user
     * @example
     * const pond = new PondChannelEngine();
     * pond.onJoinRequest((request, response) => {
     *     if (request.event.assigns.admin)
     *          response.accept();
     *     else
     *         response.reject('You are not an admin', 403);
     * });
     */
    public onJoinRequest (handler: AuthorizeMiddleware) {
        this._authorize = handler;
    }

    /**
     * @desc Handles an event request made by a user
     * @param event - The event to listen for
     * @param handler - The handler to execute when the event is received
     * @example
     * pond.onEvent('echo', (request, response) => {
     *     response.send('echo', {
     *         message: request.payload,
     *     });
     * });
     */
    public onEvent (event: PondPath, handler: (request: EventRequest, response: EventResponse) => void | Promise<void>) {
        this._middleware.use((request, response, next) => {
            if (request._parseQueries(event)) {
                return handler(request, response);
            }

            next();
        });
    }

    /**
     * @desc Builds a PondChannelManager from the current engine
     */
    public _buildManager (): PondChannelManager {
        return {
            addUser: this._addUser.bind(this),
            execute: this._execute.bind(this),
            removeUser: this._removeUser.bind(this),
            getChannels: this._getChannels.bind(this),
            listChannels: this._listChannels.bind(this),
        };
    }

    /**
     * @desc Adds a user to a channel
     * @param user - The user to add
     * @private
     */
    private _addUser (user: RequestCache) {
        const newChannel = this._getChannel(user.channelName) || this._createChannel(user.channelName);

        if (this._authorize) {
            const socketCache: SocketCache = {
                clientId: user.clientId,
                socket: user.socket,
                assigns: user.assigns,
            };

            const request = new JoinRequest(user, newChannel);
            const response = new JoinResponse(socketCache, newChannel);

            void this._authorize(request, response);
            if (!response.responseSent) {
                throw new Error('PondChannelEngine: Response was not resolved');
            }
        } else {
            newChannel.addUser(user.clientId, user.assigns, (event) => {
                user.socket.send(JSON.stringify(event));
            });
        }
    }

    /**
     * @desc Removes a user from all channels
     * @param clientId - The client id of the user to remove
     * @private
     */
    private _removeUser (clientId: string) {
        this._channels.forEach((channel) => {
            channel.removeUser(clientId, true);
        });
    }

    /**
     * @desc Creates a new channel
     * @param channelName - The name of the channel to create
     * @private
     */
    private _createChannel (channelName: string): ChannelEngine {
        const destroyChannel = this._destroyChannel.bind(this, channelName);
        const execute = this._middleware.run.bind(this._middleware);

        const parentEngine: ParentEngine = {
            execute,
            destroyChannel,
        };

        const newChannel: ChannelEngine = new ChannelEngine(channelName, parentEngine);

        this._channels.add(newChannel);

        return newChannel;
    }

    /**
     * @desc Executes a function on a channel
     * @param channelName - The name of the channel to execute the function on
     * @param handler - The function to execute
     * @private
     */
    private _execute<A> (channelName: string, handler: ((channel: ChannelEngine) => A)) {
        const newChannel = this._getChannel(channelName);

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
    private _getChannel (channelName: string): ChannelEngine | undefined {
        return Array.from(this._channels)
            .find((channel) => channel.name === channelName);
    }

    /**
     * @desc Destroys a channel
     * @param channel - The name of the channel to destroy
     * @private
     */
    private _destroyChannel (channel: string) {
        const newChannel = this._getChannel(channel);

        if (newChannel) {
            this._channels.delete(newChannel);
        }
    }

    /**
     * @desc Lists all channels
     * @private
     */
    private _listChannels () {
        return Array.from(this._channels)
            .map((channel) => channel.name);
    }

    /**
     * @desc Gets all channels
     * @private
     */
    private _getChannels () {
        return Array.from(this._channels);
    }
}
