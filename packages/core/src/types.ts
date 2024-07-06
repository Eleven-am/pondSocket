import { Server as HTTPServer } from 'http';

import {
    IncomingConnection,
    JoinParams,
    PondAssigns,
    PondEvent,
    PondEventMap,
    PondMessage,
    PondPath,
    PondPresence,
    UserData,
} from '@eleven-am/pondsocket-common';
import { WebSocket, WebSocketServer } from 'ws';

export * from '@eleven-am/pondsocket-common';

export interface LeaveEvent<EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    user: UserData<PresenceType, AssignType>;
    channel: Channel<EventTypes, PresenceType, AssignType>;
}

export type LeaveCallback<EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> = (event: LeaveEvent<EventTypes, PresenceType, AssignType>) => void;

export type RequestHandler<Request, Response> = (request: Request, response: Response) => void | Promise<void>;

export interface PondSocketOptions {
    server?: HTTPServer;
    socketServer?: WebSocketServer;
    redisUrl?: string;
    db?: number;
}

export declare class PondSocket {
    constructor(options?: PondSocketOptions);

    /**
     * @desc Specifies the port to listen on
     * @param args - the arguments to pass to the server
     */
    listen(...args: any[]): HTTPServer<typeof import('http').IncomingMessage, typeof import('http').ServerResponse>;

    /**
     * @desc Closes the server
     * @param callback - the callback to call when the server is closed
     */
    close(callback?: () => void): HTTPServer<typeof import('http').IncomingMessage, typeof import('http').ServerResponse>;

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const token = req.query.token;
     *    if (!token)
     *       return res.reject('No token provided');
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    createEndpoint<Path extends string>(path: PondPath<Path>, handler: RequestHandler<IncomingConnection<Path>, ConnectionResponse>): Endpoint;
}

export declare class Endpoint {
    /**
     * @desc Adds a new PondChannel to this path on this endpoint
     * @param {PondPath<string>} path - The path to add the channel to
     * @param {RequestHandler} handler - The handler to use to authenticate the client
     * @returns {PondChannel} - The PondChannel instance for the new channel
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
    createChannel<Path extends string, EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns>(path: PondPath<Path>, handler: RequestHandler<JoinRequest<Path, PresenceType, AssignType>, JoinResponse<EventType, PresenceType, AssignType>>): PondChannel<EventType, PresenceType, AssignType>;

    /**
     * @desc Broadcasts a message to all clients connected to this endpoint
     * @param {string} event - The event to broadcast.
     * @param {PondMessage} payload - The payload to broadcast.
     * @returns {void}
     */
    broadcast(event: string, payload: PondMessage): void;

    /**
     * @desc Closes specific clients connected to this endpoint
     * @param {string | string[]} clientIds - The ids of the clients to close.
     */
    closeConnection(clientIds: string | string[]): void;

    /**
     * @desc Returns all the clients connected to this endpoint
     */
    getClients(): WebSocket[];
}

export declare class PondChannel<EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    /**
     * @desc Handles an event request made by a user
     * @param {PondPath<string>} event - The event to handle
     * @param {RequestHandler} handler - The handlers to execute when the event is received
     * @example
     * pond.onEvent('echo', (request, response) => {
     *     response.reply('echo', {
     *         message: request.event.payload,
     *     });
     * });
     */
    onEvent<Event extends string>(event: PondPath<Event>, handler: RequestHandler<EventRequest<Event, PresenceType, AssignType>, EventResponse<EventType, PresenceType, AssignType>>): void;

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
    broadcast<Key extends keyof EventType>(event: Key, payload: EventType[Key], channelName?: string): void;

    /**
     * @desc Handles the leave event for a user, can occur when a user disconnects or leaves a channel, use this to clean up any resources
     * @param {LeaveCallback} callback - The callback to execute when a user leaves
     * @example
     * pond.onLeave((event) => {
     *     // Clean up resources
     * });
     */
    onLeave(callback: LeaveCallback<EventType, PresenceType, AssignType>): void;

    /**
     * @desc Gets a channel by name
     * @param {string} channelName - The name of the channel to get
     * @returns {Channel} - The channel instance
     * @example
     * const channel = pond.getChannel('my_channel')!;
     */
    getChannel(channelName: string): Channel<EventType, PresenceType, AssignType> | null;
}

export declare class Channel<EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    /**
     * The name of the channel.
     */
    name: string;

    /**
     * @desc Gets the current assign data for the channel.
     */
    getAssigns(): Record<string, AssignType>;

    /**
     * @desc Gets the current presence data for the channel.
     */
    getPresences(): Promise<Record<string, PresenceType>>;

    /**
     * @desc Gets the assign date for a specific user.
     * @param {string} userId - The id of the user to get the data for.
     */
    getUserData(userId: string): UserData<PresenceType, AssignType> | null;

    /**
     * @desc Broadcasts a message to every client in the channel,
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The message to send.
     */
    broadcast<Key extends keyof EventType>(event: Key, payload: EventType[Key]): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Broadcasts a message to every client in the channel except the sender,
     * @param {string} userId - The id of the user to exclude from the broadcast.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The message to send.
     */
    broadcastFrom<Key extends keyof EventType>(userId: string, event: Key, payload: EventType[Key]): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to a specific client in the channel.
     * @param {string | string[]} clientIds - The id of the client to send the message to.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The message to send.
     */
    broadcastTo<Key extends keyof EventType>(clientIds: string | string[], event: Key, payload: EventType[Key]): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Bans a user from the channel.
     * @param {string} userId - The id of the user to ban.
     * @param {string} reason - The reason for the ban.
     */
    evictUser(userId: string, reason?: string): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc tracks a user's presence in the channel
     * @param {string} userId - the id of the user to track
     * @param {PondPresence} presence - the presence data to track
     */
    trackPresence(userId: string, presence: PresenceType): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc removes a user's presence from the channel
     * @param {string} userId - the id of the user to remove
     */
    removePresence(userId: string): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc updates a user's presence in the channel
     * @param {string} userId - the id of the user to update
     * @param {PondPresence} presence - the presence data to update
     */
    updatePresence(userId: string, presence: Partial<PresenceType>): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Updates a user's assigns in the channel
     * @param userId - the id of the user to update
     * @param assigns - the assigns data to update
     */
    updateAssigns(userId: string, assigns: Partial<AssignType>): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Tracks or updates a user's presence in the channel
     * @param userId - the id of the user to upsert
     * @param presence - the presence data to upsert
     */
    upsertPresence (userId: string, presence: PresenceType): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Subscribes a user to a channel.
     * @param {string} userId - The id of the user.
     * @param {string} channel - The channel to subscribe to.
     */
    subscribeTo(userId: string, channel: string): Channel<EventType, PresenceType, AssignType>;

    /**
     * @desc Unsubscribes a user from a channel.
     * @param {string} userId - The id of the user.
     * @param {string} channel - The channel to unsubscribe from.
     */
    unsubscribeFrom(userId: string, channel: string): Channel<EventType, PresenceType, AssignType>;
}

export declare class AbstractRequest<Path extends string, PresenceType extends PondPresence, AssignType extends PondAssigns> {
    event: PondEvent<Path>;

    channelName: string;

    assigns: Record<string, AssignType>;

    getPresence(): Promise<Record<string, PresenceType>>;
}

export declare class JoinRequest<Path extends string, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> extends AbstractRequest<Path, PresenceType, AssignType> {
    joinParams: JoinParams;

    user: UserData<PresenceType, AssignType>;

    channel: Channel;
}

export declare class EventRequest<Path extends string, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> extends AbstractRequest<Path, PresenceType, AssignType> {
    user: UserData<PresenceType, AssignType>;

    channel: Channel;
}

export declare class ConnectionResponse {
    /**
     * @desc Whether the server has responded to the request
     */
    hasResponded: boolean;

    /**
     * @desc Assigns data to the user.
     * @param {PondAssigns} assigns - The data to assign.
     * @returns {ConnectionResponse} - The ConnectionResponse instance for chaining.
     */
    assign(assigns: PondAssigns): ConnectionResponse;

    /**
     * @desc Accepts the connection request to the endpoint.
     */
    accept(): ConnectionResponse;

    /**
     * @desc Rejects the request with the given error message
     * @param {string} message - The error message
     * @param {number} errorCode - The error code
     */
    decline(message?: string, errorCode?: number): void;

    /**
     * @desc Emits a direct message to the client
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     */
    reply(event: string, payload: PondMessage): ConnectionResponse;

    /**
     * @desc Subscribes the client to a channel.
     * @param {string} channel - The channel to subscribe to.
     * @returns {ConnectionResponse} - The JoinResponse instance for chaining.
     */
    subscribeTo(channel: string): ConnectionResponse;

    /**
     * @desc Unsubscribes the client from a channel.
     * @param {string} channel - The channel to unsubscribe from.
     * @returns {ConnectionResponse} - The JoinResponse instance for chaining.
     */
    unsubscribeFrom(channel: string): ConnectionResponse;
}

export declare class JoinResponse<EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    /**
     * @desc Whether the server has responded to the request
     */
    hasResponded: boolean;

    /**
     * @desc Assigns data to the client
     * @param {PondAssigns} assigns - The data to assign
     */
    assign(assigns: AssignType): JoinResponse;

    /**
     * @desc Accepts the join request to the channel.
     * @returns {JoinResponse} - The JoinResponse instance for chaining.
     */
    accept(): JoinResponse;

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param {string} message - The error message
     * @param {number} errorCode - The error code
     */
    decline(message?: string, errorCode?: number): JoinResponse;

    /**
     * @desc Emits a direct message to the client
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     * @param {PondAssigns} assigns - The data to assign to the client
     */
    reply<Key extends keyof EventType>(event: Key, payload: EventType[Key], assigns?: AssignType): JoinResponse;

    /**
     * @desc Emits a message to all clients in the channel
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     */
    broadcast<Key extends keyof EventType>(event: Key, payload: EventType[Key]): JoinResponse;

    /**
     * @desc Emits a message to all clients in the channel except the sender
     * @param event - the event name
     * @param payload - the payload to send
     */
    broadcastFrom<Key extends keyof EventType>(event: Key, payload: EventType[Key]): JoinResponse;

    /**
     * @desc Emits a message to a specific set of clients
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     * @param {string | string[]} userIds - The ids of the clients to send the message to
     */
    broadcastTo<Key extends keyof EventType>(event: Key, payload: EventType[Key], userIds: string | string[]): JoinResponse;

    /**
     * @desc tracks the presence of a client
     * @param {PondPresence} presence - the presence data to track
     */
    trackPresence(presence: PresenceType): JoinResponse;

    /**
     * @desc Subscribes the client to a channel.
     * @param {string} channel - The channel to subscribe to.
     * @returns {JoinResponse} - The JoinResponse instance for chaining.
     */
    subscribeTo(channel: string): JoinResponse;

    /**
     * @desc Unsubscribes the client from a channel.
     * @param {string} channel - The channel to unsubscribe from.
     * @returns {JoinResponse} - The JoinResponse instance for chaining.
     */
    unsubscribeFrom(channel: string): JoinResponse;
}

export declare class EventResponse<EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    /**
     * @desc Whether the server has responded to the request
     */
    hasResponded: boolean;

    /**
     * @desc Assigns data to the client.
     * @param {PondAssigns} assigns - The data to assign to the client.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    assign(assigns: AssignType): EventResponse<EventType, PresenceType, AssignType>;

    /**
     * @desc Emits a direct message to the client.
     * @param {string} event - The event name.
     * @param {PondMessage} payload - The payload to send.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    reply<Event extends keyof EventType>(event: Event, payload: EventType[Event]): EventResponse<EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to all clients in the channel.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The payload to send.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    broadcast<Event extends keyof EventType>(event: Event, payload: EventType[Event]): EventResponse<EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to all clients in the channel except the client making the request.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The payload to send.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    broadcastFrom<UserEvent extends keyof EventType>(event: UserEvent, payload: EventType[UserEvent]): EventResponse<EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to a set of clients in the channel.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The payload to send.
     * @param {string | string[]} userIds - The ids of the clients to send the message to.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    broadcastTo<UserEvent extends keyof EventType>(event: UserEvent, payload: EventType[UserEvent], userIds: string | string[]): EventResponse<EventType, PresenceType, AssignType>;

    /**
     * @desc Tracks a user's presence in the channel.
     * @param {PondPresence} presence - The initial presence data.
     * @param {string} userId - The id of the user to track.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    trackPresence(presence: PresenceType, userId?: string): EventResponse<EventType, PresenceType, AssignType>;

    /**
     * @desc Updates a user's presence in the channel.
     * @param {PondPresence} presence - The updated presence data.
     * @param {string} userId - The id of the user to update.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    updatePresence(presence: PresenceType, userId?: string): EventResponse;

    /**
     * @desc Removes a user's presence from the channel.
     * @param {string} userId - The id of the user to remove.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    removePresence(userId?: string): EventResponse;

    /**
     * @desc Subscribes the client to a channel.
     * @param {string} channel - The channel to subscribe to.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    subscribeTo(channel: string): EventResponse;

    /**
     * @desc Unsubscribes the client from a channel.
     * @param {string} channel - The channel to unsubscribe from.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    unsubscribeFrom(channel: string): EventResponse;

    /**
     * @desc Evicts a user from the channel.
     * @param {string} reason - The reason for the eviction.
     * @param {string} userId - The id of the user to evict.
     * @returns {EventResponse} - The EventResponse instance for chaining.
     */
    evictUser(reason: string, userId?: string): EventResponse;

    /**
     * @desc Closes the channel from the server side for all clients.
     * @param {string} reason - The reason for closing the channel.
     */
    closeChannel(reason: string): void;
}

