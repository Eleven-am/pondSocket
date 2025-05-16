import { Server, ServerResponse, IncomingMessage, IncomingHttpHeaders } from 'http';

import {
    IncomingConnection,
    PondAssigns,
    PondEvent,
    PondEventMap,
    PondMessage,
    PondPath,
    PondPresence,
    UserData,
    UserPresences,
    UserAssigns,
    JoinParams,
    EventParams,
    Params,
} from '@eleven-am/pondsocket-common';
import { WebSocket, WebSocketServer } from 'ws';

export * from '@eleven-am/pondsocket-common';

export interface LeaveEvent<EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    user: UserData<PresenceType, AssignType>;
    channel: Channel<EventTypes, PresenceType, AssignType>;
}

export interface OutgoingEvent<Event extends string, EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    payload: PondMessage;
    event: EventParams<Event>;
    channel: Channel<EventTypes, PresenceType, AssignType>;
}

export type LeaveCallback<EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> = (event: LeaveEvent<EventTypes, PresenceType, AssignType>) => void;

export type OutgoingHandler<Event extends string, EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> = (event: OutgoingEvent<Event, EventTypes, PresenceType, AssignType>) => PondMessage | Promise<PondMessage> | void | Promise<void>;

export type RequestHandler<Request> = (request: Request) => void | Promise<void>;

export interface PondSocketOptions {
    server?: Server;
    exclusiveServer?: boolean;
    socketServer?: WebSocketServer;
}

export declare class PondSocket {
    constructor(options?: PondSocketOptions);

    /**
     * @desc Specifies the port to listen on
     * @param args - the arguments to pass to the server
     */
    listen(...args: any[]): Server<typeof IncomingMessage, typeof ServerResponse>

    /**
     * @desc Closes the server
     * @param callback - the callback to call when the server is closed
     */
    close(callback?: () => void): Server<typeof IncomingMessage, typeof ServerResponse>

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (context) => {
     *    const token = context.query.token;
     *    if (!token)
     *       return context.decline('No token provided');
     *    context.assign({
     *       token
     *    }).accept();
     * })
     */
    createEndpoint<Path extends string>(path: PondPath<Path>, handler: RequestHandler<ConnectionContext<Path>>): Endpoint;
}

export declare class Endpoint {
    /**
     * @desc Adds a new PondChannel to this path on this endpoint
     * @param {PondPath<string>} path - The path to add the channel to
     * @param {RequestHandler} handler - The handler to use to authenticate the client
     * @returns {PondChannel} - The PondChannel instance for the new channel
     *
     * @example
     * const channel = endpoint.createChannel('/chat', (context) => {
     *     if (context.user.assigns.admin)
     *         context.accept();
     *     else
     *         context.decline('You are not an admin', 403);
     * });
     */
    createChannel<Path extends string, EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns>(path: PondPath<Path>, handler: RequestHandler<JoinContext<Path, EventType, PresenceType, AssignType>>): PondChannel<EventType, PresenceType, AssignType>;

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
     * pond.onEvent('echo', (context) => {
     *     context.reply('echo', {
     *         message: context.event.payload,
     *     });
     * });
     */
    onEvent<Event extends string>(event: PondPath<Event>, handler: RequestHandler<EventContext<Event, EventType, PresenceType, AssignType>>): void;

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
     * @desc Handles an outgoing event, this is useful for modifying the event before it is sent to the client
     * @param {PondPath<string>} event - The event to handle
     * @param {OutgoingHandler} handler - The handler to execute when the event is sent
     * @example
     * pond.onOutgoing('echo', (event) => {
     *     return {
     *         message: 'Hello, world!'
     *     };
     * });
     */
    onOutgoing<Event extends string> (event: PondPath<Event>, handler: OutgoingHandler<Event, EventType, PresenceType, AssignType>): void;

    /**
     * @desc Gets a channel by name
     * @param {string} channelName - The name of the channel to get
     * @returns {Channel} - The channel instance
     * @example
     * const channel = pond.getChannel('my_channel')!;
     *
     * if (channel === null) {
     *    console.log('Channel not found');
     *    return;
     * }
     */
    getChannel(channelName: string): Channel<EventType, PresenceType, AssignType> | null;

    /**
     * Broadcasts a message to all clients in the channel
     * @param channelName - The name of the channel to broadcast to
     * @param event - The event to send
     * @param payload - The payload to send
     * @example
     *
     * pond.broadcast('my_channel', 'message', {
     *     text: 'Hello, world!'
     * });
     */
    broadcast <Key extends keyof EventType>(channelName: string, event: Key, payload: EventType[Key]): void;

    /**
     * Broadcasts a message to all clients in the channel except the sender
     * @param channelName - The name of the channel to broadcast to
     * @param event - The event to send
     * @param payload - The payload to send
     * @example
     *
     * pond.broadcastFrom('my_channel', 'message', {
     *     text: 'Hello, everyone but me!'
     * });
     */
    broadcastFrom <Key extends keyof EventType> (channelName: string, event: Key, payload: EventType[Key]): void

    /**
     * Broadcasts a message to a specific set of clients
     * @param channelName - The name of the channel to broadcast to
     * @param event - The event to send
     * @param payload - The payload to send
     * @param userIds - The ids of the clients to send the message to
     * @example
     *
     * pond.broadcastTo('my_channel', 'message', {
     *    text: 'Hello, specific people!'
     * }, ['user1', 'user2']);
     */
    broadcastTo <Key extends keyof EventType> (channelName: string, event: Key, payload: EventType[Key], userIds: string | string[]): void;
}

export declare class Channel<EventTypes extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
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
    getPresences(): Record<string, PresenceType>;

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
    broadcast<Key extends keyof EventTypes>(event: Key, payload: EventTypes[Key]): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc Broadcasts a message to every client in the channel except the sender,
     * @param {string} userId - The id of the user to exclude from the broadcast.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The message to send.
     */
    broadcastFrom<Key extends keyof EventTypes>(userId: string, event: Key, payload: EventTypes[Key]): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc Sends a message to a specific client in the channel.
     * @param {string | string[]} clientIds - The id of the client to send the message to.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The message to send.
     */
    broadcastTo<Key extends keyof EventTypes>(clientIds: string | string[], event: Key, payload: EventTypes[Key]): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc Bans a user from the channel.
     * @param {string} userId - The id of the user to ban.
     * @param {string} reason - The reason for the ban.
     */
    evictUser(userId: string, reason?: string): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc tracks a user's presence in the channel
     * @param {string} userId - the id of the user to track
     * @param {PondPresence} presence - the presence data to track
     */
    trackPresence(userId: string, presence: PresenceType): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc removes a user's presence from the channel
     * @param {string} userId - the id of the user to remove
     */
    removePresence(userId: string): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc updates a user's presence in the channel
     * @param {string} userId - the id of the user to update
     * @param {PondPresence} presence - the presence data to update
     */
    updatePresence(userId: string, presence: Partial<PresenceType>): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc Updates a user's assigns in the channel
     * @param userId - the id of the user to update
     * @param assigns - the assigns data to update
     */
    updateAssigns(userId: string, assigns: Partial<AssignType>): Channel<EventTypes, PresenceType, AssignType>;

    /**
     * @desc Tracks or updates a user's presence in the channel
     * @param userId - the id of the user to upsert
     * @param presence - the presence data to upsert
     */
    upsertPresence(userId: string, presence: PresenceType): Channel<EventTypes, PresenceType, AssignType>;
}

export declare class ConnectionContext<Path extends string> {
    /**
     * @desc Checks if the server has responded to the connection request.
     */
    get hasResponded(): boolean;

    /**
     * @desc Get the connection details.
     */
    get connection(): IncomingConnection<Path>;

    /**
     * @desc Get the client ID.
     */
    get clientId(): string;

    /**
     * @desc Get the request ID.
     */
    get requestId(): string;

    /**
     * @desc Get the request headers.
     */
    get headers(): IncomingHttpHeaders;

    /**
     * @desc Get the request cookies.
     */
    get cookies(): Record<string, string>;

    /**
     * @desc Get the client address.
     */
    get address(): string;

    /**
     * @desc Get the event parameters.
     */
    get event(): EventParams<Path>;

    /**
     * @desc Get the query parameters.
     */
    get query(): Record<string, string>;

    /**
     * @desc Get the path parameters.
     */
    get params(): Params<Path>;

    /**
     * @desc Assigns data to the user.
     * @param {PondAssigns} assigns - The data to assign.
     * @returns {ConnectionContext} - The ConnectionContext instance for chaining.
     */
    assign(assigns: PondAssigns): ConnectionContext<Path>;

    /**
     * @desc Accepts the connection request to the endpoint.
     */
    accept(): ConnectionContext<Path>;

    /**
     * @desc Rejects the request with the given error message
     * @param {string} message - The error message
     * @param {number} errorCode - The error code
     */
    decline(message?: string, errorCode?: number): ConnectionContext<Path>;

    /**
     * @desc Emits a direct message to the client
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     */
    reply(event: string, payload: PondMessage): ConnectionContext<Path>;
}

export declare class JoinContext<Path extends string, EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    /**
     * @desc Get the event information.
     */
    get event(): PondEvent<Path>;

    /**
     * @desc Get the channel name.
     */
    get channelName(): string;

    /**
     * @desc Get the channel instance.
     */
    get channel(): Channel;

    /**
     * @desc Get the join parameters.
     */
    get joinParams(): JoinParams;

    /**
     * @desc Get all current presences in the channel.
     */
    get presences(): UserPresences;

    /**
     * @desc Get all current assigns in the channel.
     */
    get assigns(): UserAssigns;

    /**
     * @desc Get the user data.
     */
    get user(): UserData<PresenceType, AssignType>;

    /**
     * @desc Checks if the server has responded to the join request.
     */
    get hasResponded(): boolean;

    /**
     * @desc Assigns data to the client
     * @param {PondAssigns} assigns - The data to assign
     */
    assign(assigns: AssignType): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc Accepts the join request to the channel.
     * @returns {JoinContext} - The JoinContext instance for chaining.
     */
    accept(): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param {string} message - The error message
     * @param {number} errorCode - The error code
     */
    decline(message?: string, errorCode?: number): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc Emits a direct message to the client
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     */
    reply<Key extends keyof EventType>(event: Key, payload: EventType[Key]): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc Emits a message to all clients in the channel
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     */
    broadcast<Key extends keyof EventType>(event: Key, payload: EventType[Key]): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc Emits a message to all clients in the channel except the sender
     * @param event - the event name
     * @param payload - the payload to send
     */
    broadcastFrom<Key extends keyof EventType>(event: Key, payload: EventType[Key]): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc Emits a message to a specific set of clients
     * @param {string} event - The event name
     * @param {PondMessage} payload - The payload to send
     * @param {string | string[]} userIds - The ids of the clients to send the message to
     */
    broadcastTo<Key extends keyof EventType>(event: Key, payload: EventType[Key], userIds: string | string[]): JoinContext<Path, PresenceType, AssignType>;

    /**
     * @desc tracks the presence of a client
     * @param {PondPresence} presence - the presence data to track
     */
    trackPresence(presence: PresenceType): JoinContext<Path, PresenceType, AssignType>;
}

export declare class EventContext<Path extends string, EventType extends PondEventMap = PondEventMap, PresenceType extends PondPresence = PondPresence, AssignType extends PondAssigns = PondAssigns> {
    /**
     * @desc Get the event information.
     */
    get event(): PondEvent<Path>;

    /**
     * @desc Get the channel name.
     */
    get channelName(): string;

    /**
     * @desc Get the channel instance.
     */
    get channel(): Channel;

    /**
     * @desc Get all current presences in the channel.
     */
    get presences(): UserPresences;

    /**
     * @desc Get all current assigns in the channel.
     */
    get assigns(): UserAssigns;

    /**
     * @desc Get the user who sent the request.
     */
    get user(): UserData<PresenceType, AssignType>;

    /**
     * @desc Assigns data to the client.
     * @param {PondAssigns} assigns - The data to assign to the client.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    assign(assigns: AssignType): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Emits a direct message to the client.
     * @param {string} event - The event name.
     * @param {PondMessage} payload - The payload to send.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    reply<Event extends keyof EventType>(event: Event, payload: EventType[Event]): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to all clients in the channel.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The payload to send.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    broadcast<Event extends keyof EventType>(event: Event, payload: EventType[Event]): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to all clients in the channel except the client making the request.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The payload to send.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    broadcastFrom<UserEvent extends keyof EventType>(event: UserEvent, payload: EventType[UserEvent]): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Sends a message to a set of clients in the channel.
     * @param {string} event - The event to send.
     * @param {PondMessage} payload - The payload to send.
     * @param {string | string[]} userIds - The ids of the clients to send the message to.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    broadcastTo<UserEvent extends keyof EventType>(event: UserEvent, payload: EventType[UserEvent], userIds: string | string[]): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Tracks a user's presence in the channel.
     * @param {PondPresence} presence - The initial presence data.
     * @param {string} userId - The id of the user to track.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    trackPresence(presence: PresenceType, userId?: string): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Updates a user's presence in the channel.
     * @param {PondPresence} presence - The updated presence data.
     * @param {string} userId - The id of the user to update.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    updatePresence(presence: PresenceType, userId?: string): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Removes a user's presence from the channel.
     * @param {string} userId - The id of the user to remove.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    removePresence(userId?: string): EventContext<Path, EventType, PresenceType, AssignType>;

    /**
     * @desc Evicts a user from the channel.
     * @param {string} reason - The reason for the eviction.
     * @param {string} userId - The id of the user to evict.
     * @returns {EventContext} - The EventContext instance for chaining.
     */
    evictUser(reason: string, userId?: string): EventContext<Path, EventType, PresenceType, AssignType>;
}
