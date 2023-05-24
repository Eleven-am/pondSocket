import { Server as HTTPServer } from 'http';

import { WebSocketServer } from 'ws';

import type {
    UserPresences,
    UserAssigns,
    PondEvent,
    PondAssigns,
    PondMessage,
    UserData,
    PondPresence,
    Unsubscribe,
    PresencePayload,
    PondPath,
    JoinParams,
    IncomingConnection,
} from './types';

export enum ChannelState {
    IDLE = 'IDLE',
    JOINING = 'JOINING',
    JOINED = 'JOINED',
    STALLED = 'STALLED',
    CLOSED = 'CLOSED',
}

export declare class AbstractRequest<Path extends string> {
    event: PondEvent<Path>;

    channelName: string;

    assigns: UserAssigns;

    presence: UserPresences;
}

export declare abstract class PondResponse {
    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     * @param assigns - the data to assign to the client
     */
    abstract reject (message?: string, errorCode?: number, assigns?: PondAssigns): void;

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    abstract send (event: string, payload: PondMessage, assigns?: PondAssigns): void;

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    abstract accept (assigns?: PondAssigns): void;
}

export declare class EventRequest<Path extends string> extends AbstractRequest<Path> {
    user: UserData;
}

export declare class EventResponse extends PondResponse {
    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    accept (assigns?: PondAssigns): EventResponse;

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     * @param assigns - the data to assign to the client
     */
    reject (message?: string, errorCode?: number, assigns?: PondAssigns): EventResponse;

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    send (event: string, payload: PondMessage, assigns?: PondAssigns): void;

    /**
     * @desc Sends a message to all clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     */
    broadcast (event: string, payload: PondMessage): EventResponse;

    /**
     * @desc Sends a message to all clients in the channel except the client making the request
     * @param event - the event to send
     * @param payload - the payload to send
     */
    broadcastFromUser (event: string, payload: PondMessage): EventResponse;

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    sendToUsers (event: string, payload: PondMessage, userIds: string[]): EventResponse;

    /**
     * @desc Tracks a user's presence in the channel
     * @param presence - the initial presence data
     * @param userId - the id of the user to track
     */
    trackPresence (presence: PondPresence, userId?: string): EventResponse;

    /**
     * @desc Updates a user's presence in the channel
     * @param presence - the updated presence data
     * @param userId - the id of the user to update
     */
    updatePresence (presence: PondPresence, userId?: string): EventResponse;

    /**
     * @desc Removes a user's presence from the channel
     * @param userId - the id of the user to remove
     */
    unTrackPresence (userId?: string): EventResponse;

    /**
     * @desc Evicts a user from the channel
     * @param reason - the reason for the eviction
     * @param userId - the id of the user to evict,
     */
    evictUser (reason: string, userId?: string): void;

    /**
     * @desc Closes the channel from the server side for all clients
     * @param reason - the reason for closing the channel
     */
    closeChannel (reason: string): void;
}

export declare class Channel {
    /**
     * @desc Gets the current connection state of the channel.
     */
    get channelState (): ChannelState;

    /**
     * @desc Connects to the channel.
     */
    join (): void;

    /**
     * @desc Disconnects from the channel.
     */
    leave (): void;

    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    onMessage (callback: (event: string, message: PondMessage) => void): Unsubscribe;

    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    onMessageEvent (event: string, callback: (message: PondMessage) => void): Unsubscribe;

    /**
     * @desc Monitors the channel state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    onChannelStateChange (callback: (connected: ChannelState) => void): Unsubscribe;

    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    onJoin (callback: (presence: PondPresence) => void): Unsubscribe;

    /**
     * @desc Detects when clients leave the channel.
     * @param callback - The callback to call when a client leaves the channel.
     */
    onLeave (callback: (presence: PondPresence) => void): Unsubscribe;

    /**
     * @desc Detects when clients change their presence in the channel.
     * @param callback - The callback to call when a client changes their presence in the channel.
     */
    onPresenceChange (callback: (presence: PresencePayload) => void): Unsubscribe;

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    sendMessage (event: string, payload: PondMessage, recipient: string[]): void;

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcastFrom (event: string, payload: PondMessage): void;

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcast (event: string, payload: PondMessage): void;

    /**
     * @desc Gets the current presence of the channel.
     */
    getPresence (): PondPresence[];

    /**
     * @desc Monitors the presence of the channel.
     * @param callback - The callback to call when the presence changes.
     */
    onUsersChange (callback: (users: PondPresence[]) => void): Unsubscribe;

    /**
     * @desc Gets the current connection state of the channel.
     */
    isConnected (): boolean;

    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    onConnectionChange (callback: (connected: boolean) => void): Unsubscribe;
}

export declare class Client {
    /**
     * @desc Gets the current assign data for the channel.
     */
    get getAssigns (): UserAssigns;

    /**
     * @desc Gets the assign date for a specific user.
     * @param userId - The id of the user to get the assign data for.
     */
    getUserData (userId: string): UserData;

    /**
     * @desc Broadcasts a message to every client in the channel,
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcastMessage (event: string, payload: PondMessage): void;

    /**
     * @desc Sends a message to a specific client in the channel.
     * @param userId - The id of the user to send the message to.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    sendToUser (userId: string, event: string, payload: PondMessage): void;

    /**
     * @desc Bans a user from the channel.
     * @param userId - The id of the user to ban.
     * @param reason - The reason for the ban.
     */
    banUser (userId: string, reason?: string): void;

    /**
     * @desc tracks a user's presence in the channel
     * @param userId - the id of the user to track
     * @param presence - the presence of the user
     */
    trackPresence (userId: string, presence: PondPresence): void;

    /**
     * @desc removes a user's presence from the channel
     * @param userId - the id of the user to remove
     */
    removePresence (userId: string): void;

    /**
     * @desc updates a user's presence in the channel
     * @param userId - the id of the user to update
     * @param presence - the new presence of the user
     */
    updatePresence (userId: string, presence: PondPresence): void;
}

export declare class Endpoint {
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
    createChannel<Path extends string> (path: PondPath<Path>, handler: (request: JoinRequest<Path>, response: JoinResponse) => void | Promise<void>): PondChannel;

    /**
     * @desc Broadcasts a message to all clients connected to this endpoint
     * @param event - The event to broadcast
     * @param payload - The payload to broadcast
     */
    broadcast (event: string, payload: PondMessage): void;

    /**
     * @desc Closes specific clients connected to this endpoint
     * @param clientIds - The id for the client / clients to close
     */
    closeConnection (clientIds: string | string[]): void;
}

export declare class JoinRequest<Path extends string> extends AbstractRequest<Path> {
    joinParams: JoinParams;

    user: UserData;

    client: Client;
}

export declare class JoinResponse extends PondResponse {
    #private;

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    accept (assigns?: PondAssigns): JoinResponse;

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     */
    reject (message?: string, errorCode?: number): JoinResponse;

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    send (event: string, payload: PondMessage, assigns?: PondAssigns): this;

    /**
     * @desc Emits a message to all clients in the channel
     * @param event - the event name
     * @param payload - the payload to send
     */
    broadcast (event: string, payload: PondMessage): JoinResponse;

    /**
     * @desc Emits a message to all clients in the channel except the sender
     * @param event - the event name
     * @param payload - the payload to send
     */
    broadcastFromUser (event: string, payload: PondMessage): JoinResponse;

    /**
     * @desc Emits a message to a specific set of clients
     * @param event - the event name
     * @param payload  - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    sendToUsers (event: string, payload: PondMessage, userIds: string[]): JoinResponse;

    /**
     * @desc tracks the presence of a client
     * @param presence - the presence data to track
     */
    trackPresence (presence: PondPresence): JoinResponse;
}

export declare class ConnectionResponse extends PondResponse {
    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    accept (assigns?: PondAssigns): void;

    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    reject (message?: string, errorCode?: number): void;

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    send (event: string, payload: PondMessage, assigns?: PondAssigns): void;
}

export declare class PondChannel {
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
    onEvent<Event extends string> (event: PondPath<Event>, handler: (request: EventRequest<Event>, response: EventResponse) => void | Promise<void>): void;

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
    broadcast (event: string, payload: PondMessage, channelName?: string): void;
}

export declare class PondSocket {
    constructor (server?: HTTPServer, socketServer?: WebSocketServer);

    /**
     * @desc Specifies the port to listen on
     * @param args - the arguments to pass to the server
     */
    listen (...args: any[]): HTTPServer<typeof import('http').IncomingMessage, typeof import('http').ServerResponse>;

    /**
     * @desc Closes the server
     * @param callback - the callback to call when the server is closed
     */
    close (callback?: () => void): HTTPServer<typeof import('http').IncomingMessage, typeof import('http').ServerResponse>;

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
    createEndpoint<Path extends string> (path: PondPath<Path>, handler: (request: IncomingConnection<Path>, response: ConnectionResponse) => void | Promise<void>): Endpoint;
}

export declare class PondClient {
    constructor (endpoint: string, params?: Record<string, any>);

    /**
     * @desc Connects to the server and returns the socket.
     */
    connect (backoff?: number): void;

    /**
     * @desc Returns the current state of the socket.
     */
    getState (): boolean;

    /**
     * @desc Disconnects the socket.
     */
    disconnect (): void;

    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    createChannel (name: string, params?: JoinParams): Channel;

    /**
     * @desc Subscribes to the connection state.
     * @param callback - The callback to call when the state changes.
     */
    onConnectionChange (callback: (state: boolean) => void): Unsubscribe;
}

