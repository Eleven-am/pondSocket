import {
    ChannelEvent,
    ClientActions,
    ClientMessage,
    clientMessageSchema,
    ErrorTypes,
    JoinParams,
    PondAssigns,
    PondMessage,
    PondPath,
    ServerActions,
    SystemSender,
    Unsubscribe,
    uuid,
} from '@eleven-am/pondsocket-common';
import { WebSocket } from 'ws';
import { ZodError } from 'zod';

import { Middleware } from '../abstracts/middleware';
import { ChannelEngine } from '../channel/channel';
import { ChannelError, EndpointError, PresenceError } from '../errors/pondError';
import { JoinRequest } from '../lobby/joinRequest';
import { JoinResponse } from '../lobby/joinResponse';
import { LobbyEngine, PondChannel } from '../lobby/lobby';
import { parseAddress } from '../matcher/matcher';
import { PondSocket } from '../server/pondSocket';

type AuthorizationHandler<Event extends string> = (request: JoinRequest<Event>, response: JoinResponse) => void | Promise<void>;

export interface SocketCache {
    clientId: string;
    socket: WebSocket;
    assigns: PondAssigns;
    subscriptions: Map<string, Unsubscribe>;
}

export interface RequestCache extends SocketCache {
    channelName: string;
    requestId: string;
}

export class EndpointEngine {
    readonly #middleware: Middleware<RequestCache, JoinParams>;

    readonly #channels: Map<PondPath<string>, LobbyEngine>;

    readonly #sockets: Map<string, SocketCache>;

    readonly #parentEngine: PondSocket;

    constructor (parent: PondSocket) {
        this.#sockets = new Map();
        this.#middleware = new Middleware();
        this.#channels = new Map();
        this.#parentEngine = parent;
    }

    get parent () {
        return this.#parentEngine;
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
        const pondChannel = new LobbyEngine(this);

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

        this.#channels.set(path, pondChannel);

        return new PondChannel(pondChannel);
    }

    /**
     * @desc Gets all clients connected to this endpoint
     */
    public getClients () {
        return [...this.#sockets.values()];
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
                requestId: uuid(),
                action: ServerActions.BROADCAST,
                channelName: SystemSender.ENDPOINT,
            };

            this.sendMessage(socket, message);
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
        this.#sockets.set(cache.clientId, cache);
        const socket = cache.socket;

        socket.addEventListener('message', (message) => {
            this.#readMessage(cache, message.data as string);
        });

        socket.addEventListener('close', () => {
            this.#sockets.delete(cache.clientId);
            cache.subscriptions.forEach((unsubscribe) => unsubscribe());
        });

        socket.addEventListener('error', () => {
            this.#sockets.delete(cache.clientId);
            cache.subscriptions.forEach((unsubscribe) => unsubscribe());
        });
    }

    /**
     * @desc Retrieves a user from the endpoint
     * @param clientId - The id of the user to retrieve
     * @private
     */
    getUser (clientId: string) {
        const user = this.#sockets.get(clientId);

        if (!user) {
            throw new EndpointError(`GatewayEngine: User ${clientId} does not exist`, 404);
        }

        return user;
    }

    /**
     * @desc Subscribes a user to a channel, Will join the channel if it exists or add to pending subscriptions
     * @param userId - The id of the user to subscribe
     * @param channel - The name of the channel to subscribe to
     */
    subscribeTo (userId: string, channel: string) {
        const user = this.getUser(userId);
        const channelEngine = this.#retrieveChannel(channel);
        const onMessage = this.sendMessage.bind(this, user.socket);
        const subscription = channelEngine.addUser(userId, user.assigns, onMessage);

        user.subscriptions.set(channel, subscription);
    }

    /**
     * @desc Unsubscribes a user from a channel
     * @param userId - The id of the user to unsubscribe
     * @param channel - The name of the channel to unsubscribe from
     */
    unsubscribeFrom (userId: string, channel: string) {
        const user = this.getUser(userId);
        const unsubscribe = user.subscriptions.get(channel);

        if (unsubscribe) {
            unsubscribe();
            user.subscriptions.delete(channel);

            return;
        }

        throw new EndpointError(`GatewayEngine: Channel ${channel} does not exist`, 404);
    }

    /**
     * @desc Sends a message to a client
     * @param socket - The socket to send the message to
     * @param message - The message to send
     */
    sendMessage (socket: WebSocket, message: ChannelEvent) {
        socket.send(JSON.stringify(message));
    }

    /**
     * @desc Adds a new client to a channel on this endpoint
     * @param channel - The channel to add the client to
     * @param socket - The client to add to the channel
     * @param joinParams - The parameters to pass to the channel
     * @param requestId - The id of the request
     * @private
     */
    #joinChannel (channel: string, socket: SocketCache, joinParams: Record<string, any>, requestId: string) {
        const cache: RequestCache = {
            ...socket,
            requestId,
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
    #execute (channel: string, handler: ((manager: ChannelEngine) => void)) {
        for (const [path, manager] of this.#channels) {
            const event = parseAddress(path, channel);

            if (event) {
                return manager.execute(channel, handler);
            }
        }
    }

    /**
     * @desc Retrieves a channel from the endpoint
     * @param channel - The name of the channel to retrieve
     * @private
     */
    #retrieveChannel (channel: string) {
        let channelEngine: ChannelEngine | undefined;

        for (const [path, manager] of this.#channels) {
            const event = parseAddress(path, channel);

            if (event) {
                channelEngine = manager.getChannel(channel) || manager.createChannel(channel);
                break;
            }
        }

        if (!channelEngine) {
            throw new EndpointError(`GatewayEngine: Channel ${channel} does not exist`, 400);
        }

        return channelEngine;
    }

    /**
     * @desc Deals with a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     */
    #handleMessage (cache: SocketCache, message: ClientMessage) {
        switch (message.action) {
            case ClientActions.JOIN_CHANNEL:
                this.#joinChannel(message.channelName, cache, message.payload, message.requestId);
                break;

            case ClientActions.LEAVE_CHANNEL:
                this.#leaveChannel(message.channelName, cache);
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
        try {
            const data = JSON.parse(message);

            const result = clientMessageSchema.parse(data);

            this.#handleMessage(cache, result);
        } catch (e) {
            this.sendMessage(cache.socket, this.#buildError(e));
        }
    }

    /**
     * @desc Builds an error message
     * @param error - The error to build
     * @private
     */
    #buildError (error: unknown) {
        const event: ChannelEvent = {
            event: ErrorTypes.INVALID_MESSAGE,
            action: ServerActions.ERROR,
            channelName: SystemSender.ENDPOINT,
            requestId: uuid(),
            payload: {},
        };

        if (error instanceof SyntaxError) {
            event.payload = {
                message: 'Invalid JSON',
            };
        } else if (error instanceof Error) {
            event.event = ErrorTypes.INTERNAL_SERVER_ERROR;
            event.payload = {
                message: error.message,
            };
        } else if (error instanceof PresenceError) {
            event.event = ErrorTypes.PRESENCE_ERROR;
            event.channelName = error.channel;
            event.payload = {
                message: error.message,
                code: error.code,
                action: error.event,
            };
        } else if (error instanceof ChannelError) {
            event.event = ErrorTypes.CHANNEL_ERROR;
            event.channelName = error.channel;
            event.payload = {
                message: error.message,
                code: error.code,
            };
        } else if (error instanceof EndpointError) {
            event.event = ErrorTypes.ENDPOINT_ERROR;
            event.payload = {
                message: error.message,
                code: error.code,
            };
        } else if (error instanceof ZodError) {
            const message = error.errors.map((error) => {
                if ('expected' in error && 'received' in error) {
                    return `Expected ${error.path.join('.')} to be ${error.expected}, but received ${error.received}`;
                }

                return `${error.path.join('.')} ${error.message}`;
            }).join(', ');

            event.payload = {
                message,
                code: 400,
            };
        } else {
            event.payload = {
                message: 'Unknown error',
            };
        }

        return event;
    }

    /**
     * @desc Removes a client from a channel
     * @param channel - The name of the channel to remove the client from
     * @param socket - The socket of the client to remove
     * @private
     */
    #leaveChannel (channel: string, socket: SocketCache) {
        const unsubscribe = socket.subscriptions.get(channel);

        if (!unsubscribe) {
            throw new EndpointError(`GatewayEngine: Channel ${channel} does not exist`, 404);
        }

        unsubscribe();
        socket.subscriptions.delete(channel);
    }
}

export class Endpoint {
    readonly #engine: EndpointEngine;

    constructor (engine: EndpointEngine) {
        this.#engine = engine;
    }

    public createChannel<Path extends string> (path: PondPath<Path>, handler: AuthorizationHandler<Path>) {
        return this.#engine.createChannel(path, handler);
    }

    public broadcast (event: string, payload: PondMessage) {
        this.#engine.broadcast(event, payload);
    }

    public closeConnection (clientIds: string | string[]) {
        this.#engine.closeConnection(clientIds);
    }

    public getClients () {
        return this.#engine.getClients().map(({ socket }) => socket);
    }
}
