import { WebSocket, WebSocketServer } from 'ws';

import { Middleware } from '../abstracts/middleware';
import { ChannelEngine } from '../channel/channel';
import { ServerActions, SystemSender, ErrorTypes, ClientActions } from '../enums';
import { EndpointError, PresenceError, ChannelError } from '../errors/pondError';
import { JoinRequest } from '../lobby/joinRequest';
import { JoinResponse } from '../lobby/joinResponse';
import { LobbyEngine, PondChannel } from '../lobby/lobby';
import { parseAddress } from '../matcher/matcher';
import type { PondAssigns, ClientMessage, PondMessage, ChannelEvent, JoinParams, PondPath } from '../types';

type AuthorizationHandler<Event extends string> = (request: JoinRequest<Event>, response: JoinResponse) => void | Promise<void>;

export interface SocketCache {
    clientId: string;
    socket: WebSocket;
    assigns: PondAssigns;
}

export interface RequestCache extends SocketCache {
    channelName: string;
}

export class Endpoint {
    readonly #middleware: Middleware<RequestCache, JoinParams>;

    readonly #channels: Set<LobbyEngine>;

    readonly #sockets: Set<SocketCache>;

    constructor () {
        this.#sockets = new Set();
        this.#middleware = new Middleware();
        this.#channels = new Set();
    }

    /**
     * @desc Adds a new PondChannel to this path on this endpoint
     * @param path - The path to add the channel to
     * @param handler - The handler to use to authenticate the client
     *
     * @example
     * const channel = endpoint.createChannel('/chat', (request, response) => {
     *     if (request.user.assigns.admin)
     *         response.accept();
     *
     *     else
     *         response.reject('You are not an admin', 403);
     * });
     */
    public createChannel<Path extends string> (path: PondPath<Path>, handler: AuthorizationHandler<Path>) {
        const pondChannel = new LobbyEngine();

        this.#middleware.use((user, joinParams, next) => {
            const event = parseAddress(path, user.channelName);

            if (event) {
                const newChannel = pondChannel.getChannel(user.channelName) || pondChannel.createChannel(user.channelName);
                const request = new JoinRequest(user, joinParams, newChannel);
                const response = new JoinResponse(user, newChannel);

                if (request._parseQueries(path)) {
                    return handler(request as JoinRequest<Path>, response);
                }
            }

            next();
        });

        this.#channels.add(pondChannel);

        return new PondChannel(pondChannel);
    }

    /**
     * @desc List all clients connected to this endpoint
     */
    public listConnections () {
        return [...this.#sockets].map(({ clientId }) => clientId);
    }

    /**
     * @desc Gets all clients connected to this endpoint
     */
    public getClients () {
        return [...this.#sockets];
    }

    /**
     * @desc Broadcasts a message to all clients connected to this endpoint
     * @param event - The event to broadcast
     * @param payload - The payload to broadcast
     */
    public broadcast (event: string, payload: PondMessage) {
        this.#sockets.forEach(({ socket }) => {
            const message: ChannelEvent = {
                event,
                payload,
                action: ServerActions.BROADCAST,
                channelName: SystemSender.ENDPOINT,
            };

            this.#sendMessage(socket, message);
        });
    }

    /**
     * @desc Closes specific clients connected to this endpoint
     * @param clientIds - The id for the client / clients to close
     */
    public closeConnection (clientIds: string | string[]) {
        const clients = typeof clientIds === 'string' ? [clientIds] : clientIds;

        this.getClients()
            .forEach(({ clientId, socket }) => {
                if (clients.includes(clientId)) {
                    socket.close();
                }
            });
    }

    /**
     * @desc Manages a new socket connection
     * @param cache - The socket cache
     */
    public manageSocket (cache: SocketCache) {
        this.#sockets.add(cache);
        const socket = cache.socket;

        socket.addEventListener('message', (message) => {
            this.#readMessage(cache, message.data as string);
        });

        socket.addEventListener('close', () => {
            this.#channels
                .forEach((manager) => manager.removeUser(cache.clientId, true));
        });

        socket.addEventListener('error', () => {
            this.#channels
                .forEach((manager) => manager.removeUser(cache.clientId, true));
        });
    }

    /**
     * @desc Sends a message to a client
     * @param socket - The socket to send the message to
     * @param message - The message to send
     */
    #sendMessage (socket: WebSocket, message: ChannelEvent) {
        socket.send(JSON.stringify(message));
    }

    /**
     * @desc Adds a new client to a channel on this endpoint
     * @param channel - The channel to add the client to
     * @param socket - The client to add to the channel
     * @param joinParams - The parameters to pass to the channel
     * @private
     */
    #joinChannel (channel: string, socket: SocketCache, joinParams: Record<string, any>) {
        const cache: RequestCache = {
            ...socket,
            channelName: channel,
        };

        this.#middleware.run(cache, joinParams, () => {
            throw new EndpointError(`GatewayEngine: Channel ${channel} does not exist`, 404);
        });
    }

    /**
     * @desc Executes a function on a channel
     * @param channel - The channel to execute the function on
     * @param handler - The function to execute
     * @private
     */
    #execute<ReturnType> (channel: string, handler: ((manager: ChannelEngine) => ReturnType)): ReturnType {
        for (const manager of this.#channels) {
            const isPresent = manager.listChannels()
                .includes(channel);

            if (isPresent) {
                return manager.execute(channel, handler);
            }
        }

        throw new Error(`GatewayEngine: Channel ${channel} does not exist`);
    }

    /**
     * @desc Deals with a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     */
    #handleMessage (cache: SocketCache, message: ClientMessage) {
        switch (message.action) {
            case ClientActions.JOIN_CHANNEL:
                this.#joinChannel(message.channelName, cache, message.payload);
                break;

            case ClientActions.LEAVE_CHANNEL:
                this.#execute(message.channelName, (channel) => {
                    channel.removeUser(cache.clientId);
                });
                break;

            case ClientActions.BROADCAST:
                this.#execute(message.channelName, (channel) => {
                    channel.broadcastMessage(cache.clientId, message);
                });
                break;

            default:
                throw new Error(`GatewayEngine: Action ${message.action} does not exist`);
        }
    }

    /**
     * @desc Handles a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     * @private
     */
    #readMessage (cache: SocketCache, message: string) {
        const errorMessage: ChannelEvent = {
            event: ErrorTypes.INVALID_MESSAGE,
            action: ServerActions.ERROR,
            channelName: SystemSender.ENDPOINT,
            payload: {},
        };

        try {
            const data = JSON.parse(message) as ClientMessage;

            if (!data.action) {
                errorMessage.payload = {
                    message: 'No action provided',
                };
            } else if (!data.channelName) {
                errorMessage.payload = {
                    message: 'No channel name provided',
                };
            } else if (!data.payload) {
                errorMessage.payload = {
                    message: 'No payload provided',
                };
            }

            if (!this.#isObjectEmpty(errorMessage.payload)) {
                this.#sendMessage(cache.socket, errorMessage);
            } else {
                this.#handleMessage(cache, data);
            }
        } catch (e) {
            if (e instanceof SyntaxError) {
                errorMessage.payload = {
                    message: 'Invalid JSON',
                };
            } else if (e instanceof Error) {
                errorMessage.event = ErrorTypes.INTERNAL_SERVER_ERROR;
                errorMessage.payload = {
                    message: e.message,
                };
            } else if (e instanceof PresenceError) {
                errorMessage.event = ErrorTypes.PRESENCE_ERROR;
                errorMessage.channelName = e.channel;
                errorMessage.payload = {
                    message: e.message,
                    code: e.code,
                    action: e.event,
                };
            } else if (e instanceof ChannelError) {
                errorMessage.event = ErrorTypes.CHANNEL_ERROR;
                errorMessage.channelName = e.channel;
                errorMessage.payload = {
                    message: e.message,
                    code: e.code,
                };
            } else if (e instanceof EndpointError) {
                errorMessage.event = ErrorTypes.ENDPOINT_ERROR;
                errorMessage.payload = {
                    message: e.message,
                    code: e.code,
                };
            }

            this.#sendMessage(cache.socket, errorMessage);
        }
    }

    /**
     * @desc Checks if an object is empty
     * @param obj - The object to check
     * @private
     */
    #isObjectEmpty (obj: Record<string, any>) {
        return Object.keys(obj).length === 0;
    }
}
