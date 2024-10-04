import {
    ChannelEvent,
    PondPath,
    JoinParams,
    ClientMessage,
    ClientActions,
    clientMessageSchema,
    ErrorTypes,
    ServerActions,
    uuid,
    SystemSender,
    Events,
    Unsubscribe,
} from '@eleven-am/pondsocket-common';
import { WebSocket } from 'ws';

import { LobbyEngine } from './lobbyEngine';
import { Middleware } from '../abstracts/middleware';
import { SocketCache, AuthorizationHandler, RequestCache, JoinRequestOptions, ClientFactory } from '../abstracts/types';
import { HttpError } from '../errors/httpError';
import { ManagerFactory } from '../managers/managerFactory';
import { parseAddress } from '../matcher/matcher';
import { JoinRequest } from '../requests/joinRequest';
import { JoinResponse } from '../responses/joinResponse';
import { PondChannel } from '../wrappers/pondChannel';


export class EndpointEngine {
    readonly #clientFactory: ClientFactory | null;

    readonly #sockets: Map<string, SocketCache>;

    readonly #middleware: Middleware<RequestCache, JoinParams>;

    readonly #lobbyEngines: Map<PondPath<string>, LobbyEngine>;

    constructor (clientFactory: ClientFactory | null) {
        this.#sockets = new Map();
        this.#lobbyEngines = new Map();
        this.#middleware = new Middleware();
        this.#clientFactory = clientFactory;
    }

    createChannel<Path extends string> (path: PondPath<Path>, handler: AuthorizationHandler<Path>) {
        const pondChannel = new LobbyEngine(this);

        this.#middleware.use((user, joinParams, next) => {
            const event = parseAddress(path, user.channelName);

            if (event) {
                const options: JoinRequestOptions<Path> = {
                    clientId: user.clientId,
                    assigns: user.assigns,
                    params: event,
                    joinParams,
                };

                const channel = pondChannel.getOrCreateChannel(user.channelName);
                const request = new JoinRequest(options, channel);
                const response = new JoinResponse(user, channel);

                return handler(request, response, next);
            }

            next();
        });

        this.#lobbyEngines.set(path, pondChannel);

        return new PondChannel(pondChannel);
    }

    getClients () {
        return [...this.#sockets.values()];
    }

    getUser (clientId: string) {
        const user = this.#sockets.get(clientId);

        if (!user) {
            throw new HttpError(404, `GatewayEngine: User ${clientId} does not exist`);
        }

        return user;
    }

    manageSocket (cache: SocketCache) {
        this.#sockets.set(cache.clientId, cache);
        cache.socket.on('message', (message: string) => this.#readMessage(cache, message));
        cache.socket.on('close', () => this.#handleSocketClose(cache));
        cache.socket.on('error', () => this.#handleSocketClose(cache));

        const event: ChannelEvent = {
            event: Events.CONNECTION,
            action: ServerActions.CONNECT,
            channelName: SystemSender.ENDPOINT,
            requestId: uuid(),
            payload: {},
        };

        this.sendMessage(cache.socket, event);
    }

    createManager (channelName: string, onLeave: Unsubscribe) {
        return ManagerFactory.create(channelName, this.#clientFactory, onLeave);
    }

    sendMessage (socket: WebSocket, message: ChannelEvent) {
        socket.send(JSON.stringify(message));
    }

    closeConnection (clientIds: string | string[]) {
        const clients = typeof clientIds === 'string' ? [clientIds] : clientIds;

        this.getClients()
            .forEach(({ clientId, socket }) => {
                if (clients.includes(clientId)) {
                    socket.close();
                }
            });
    }

    #handleSocketClose (cache: SocketCache) {
        try {
            this.#sockets.delete(cache.clientId);
            cache.subscriptions.forEach((unsubscribe) => unsubscribe());
        } catch (e) {
            // no-op
        }
    }

    #handleMessage (cache: SocketCache, message: ClientMessage) {
        switch (message.action) {
            case ClientActions.JOIN_CHANNEL:
                this.#joinChannel(message.channelName, cache, message.payload, message.requestId);
                break;

            case ClientActions.LEAVE_CHANNEL:
                this.#leaveChannel(message.channelName, cache);
                break;

            case ClientActions.BROADCAST:
                this.#broadcastMessage(cache, message);
                break;

            default:
                throw new Error(`GatewayEngine: Action ${message.action} does not exist`);
        }
    }

    #joinChannel (channel: string, socket: SocketCache, joinParams: JoinParams, requestId: string) {
        const cache: RequestCache = {
            ...socket,
            requestId,
            channelName: channel,
        };

        this.#middleware.run(cache, joinParams, (error) => {
            error = error || new HttpError(404, `GatewayEngine: Channel ${channel} does not exist`);
            throw error;
        });
    }

    #leaveChannel (channel: string, socket: SocketCache) {
        const engine = this.#retrieveChannel(channel);

        engine.removeUser(socket.clientId);
    }

    #retrieveChannel (channel: string) {
        for (const [path, manager] of this.#lobbyEngines) {
            const event = parseAddress(path, channel);

            if (event) {
                return manager.getChannel(channel);
            }
        }

        throw new HttpError(404, `GatewayEngine: Channel ${channel} does not exist`);
    }

    #buildError (error: unknown) {
        const event: ChannelEvent = {
            event: ErrorTypes.INVALID_MESSAGE,
            action: ServerActions.ERROR,
            channelName: SystemSender.ENDPOINT,
            requestId: uuid(),
            payload: {},
        };

        return event;
    }

    #broadcastMessage (socket: SocketCache, message: ClientMessage) {
        const engine = this.#retrieveChannel(message.channelName);

        engine.broadcastMessage(socket.clientId, message);
    }

    #readMessage (cache: SocketCache, message: string) {
        try {
            const data = JSON.parse(message);

            const result = clientMessageSchema.parse(data);

            this.#handleMessage(cache, result);
        } catch (e) {
            this.sendMessage(cache.socket, this.#buildError(e));
        }
    }
}
