import { Server as HTTPServer, IncomingMessage, IncomingHttpHeaders } from 'http';
import internal from 'stream';

// eslint-disable-next-line import/no-unresolved
import { Express } from 'express';
import { WebSocketServer, WebSocket } from 'ws';

import { ClientActions, PresenceEventTypes } from './enums';

export type PondPath = string | RegExp;
type NextFunction = () => void;
export type JoinParams = Record<string, any>;
type PondAssigns = Record<string, any>;
export type PondMessage = Record<string, any>;
export type PondPresence = Record<string, any>;
export type EndpointHandler = (req: IncomingConnection, res: ConnectionResponse) => void;
type SocketCache = Pick<RequestCache, 'socket' | 'clientId' | 'assigns'>;
type AuthorizeMiddleware = (request: JoinRequest, response: JoinResponse) => void | Promise<void>;
type SocketMiddlewareFunction = (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void;
export type ChannelReceivers = 'all_users' | 'all_except_sender' | string[];
export type ChannelSenders = 'channel' | string;
export type ChannelEvent = Event | PresenceEvent;

interface Event {
    action: 'SYSTEM' | 'BROADCAST' | 'ERROR';
    event: string;
    payload: PondMessage;
    channelName: string;
}
export interface ClientMessage {
    action: ClientActions;
    channelName: string;
    event: string;
    payload: Record<string, any>;
    addresses?: ChannelReceivers;
}
interface PresenceEvent {
    action: 'PRESENCE';
    event: PresenceEventTypes;
    channelName: string;
    payload: PresencePayload;
}
interface RequestCache {
    clientId: string;
    socket: WebSocket;
    channelName: string;
    assigns: PondAssigns;
    joinParams: Record<string, any>;
    params: Record<string, string>;
    query: Record<string, string>;
}
interface UserAssigns {
    [userId: string]: PondAssigns;
}
interface UserData {
    assigns: PondAssigns;
    presence: PondPresence;
    id: string;
}
interface EventObject {
    event: string;
    params: Record<string, string>;
    query: Record<string, string>;
    payload: PondMessage;
}
interface IncomingConnection {
    id: string;
    params: Record<string, string>;
    query: Record<string, string>;
    headers: IncomingHttpHeaders;
    address: string;
}
interface UserPresences {
    [userId: string]: PondPresence;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        export interface Application {
            upgrade(path: PondPath, handler: EndpointHandler): Endpoint;
        }
    }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
interface PondSocketExpressApp extends Express {

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const token = req.query.token;
     *    if (!token)
     *       return res.reject("No token provided");
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    upgrade(path: PondPath, handler: EndpointHandler): Endpoint;
}
export type PondState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
type Unsubscribe = () => void;

export interface PresencePayload {
    changed: PondPresence;
    presence: PondPresence[];
}

export declare class Channel {
    /**
     * @desc Connects to the channel.
     */
    public join(): void;

    /**
     * @desc Disconnects from the channel.
     */
    public leave(): void;

    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    public onMessage(event: string, callback: (message: PondMessage) => void): Unsubscribe;

    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    public onConnectionChange(callback: (connected: boolean) => void): Unsubscribe;

    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    public onJoin(callback: (presence: PondPresence) => void): Unsubscribe;

    /**
     * @desc Detects when clients leave the channel.
     * @param callback - The callback to call when a client leaves the channel.
     */
    public onLeave(callback: (presence: PondPresence) => void): Unsubscribe;

    /**
     * @desc Detects when clients change their presence in the channel.
     * @param callback - The callback to call when a client changes their presence in the channel.
     */
    public onPresenceChange(callback: (presence: PresencePayload) => void): Unsubscribe;

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    public sendMessage(event: string, payload: PondMessage, recipient: string[]): void;

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcastFrom(event: string, payload: PondMessage): void;

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcast(event: string, payload: PondMessage): void;

    /**
     * @desc Gets the current connection state of the channel.
     */
    public isConnected(): boolean;


    /**
     * @desc check is the channel has been closed.
     */
    public hasClosed(): boolean;

    /**
     * @desc Gets the current presence of the channel.
     */
    public getPresence(): PondPresence[];

    /**
     * @desc Monitors the presence of the channel.
     * @param callback - The callback to call when the presence changes.
     */
    public onUsersChange(callback: (users: PondPresence[]) => void): Unsubscribe;
}

export declare class PondSocketClient {
    constructor(endpoint: string, params?: Record<string, any>);

    /**
     * @desc Connects to the server and returns the socket.
     */
    public connect(backoff?: number): void;

    /**
     * @desc Returns the current state of the socket.
     */
    public getState(): PondState;

    /**
     * @desc Disconnects the socket.
     */
    public disconnect(): void;

    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    public createChannel(name: string, params?: JoinParams): Channel;
}

declare class AbstractRequest {
    get event (): EventObject;

    get channelNme (): string;

    get assigns (): UserAssigns;

    get presence (): UserPresences;
}

declare class EventRequest extends AbstractRequest {
    get user (): UserData;
}

declare class EventResponse {
    /**
     * @desc Checks if the response has been sent
     */
    get responseSent (): boolean;

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
    send (event: string, payload: PondMessage, assigns?: PondAssigns): EventResponse;

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

declare class JoinRequest extends AbstractRequest {
    get joinParams (): JoinParams;

    get user (): UserData;

    get event (): EventObject;
}

declare class JoinResponse {
    get responseSent (): boolean;

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

declare class PondChannel {
    /**
     * @desc Authorize a user to join a channel
     * @param handler - The handler to authorize the user
     * @example
     * const pond = new PondChannelEngine();
     * pond.onJoinRequest((request, response) => {
     *     if (request.user.assigns.admin)
     *          response.accept();
     *     else
     *         response.reject('You are not an admin', 403);
     * });
     */
    onJoinRequest (handler: AuthorizeMiddleware): void;

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
    onEvent (event: PondPath, handler: (request: EventRequest, response: EventResponse) => void | Promise<void>): void;

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

declare class ConnectionResponse {
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

export declare class Endpoint {
    /**
     * @desc Adds a new PondChannel to this path on this endpoint
     * @param path - The path to add the channel to
     * @param channel - The channel to add
     *
     * @example
     * endpoint.useChannel('/chat', pondChannelInstance);
     */
    addChannel (path: PondPath, channel: PondChannel): void;

    /**
     * @desc List all clients connected to this endpoint
     */
    listConnections (): string[];

    /**
     * @desc Gets all clients connected to this endpoint
     */
    getClients (): SocketCache[];

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

export declare class PondSocket {
    constructor (server?: HTTPServer, socketServer?: WebSocketServer);

    /**
     * @desc Specifies the port to listen on
     * @param port - the port to listen on
     * @param callback - the callback to call when the server is listening
     */
    listen (port: number, callback: (port?: number) => void): HTTPServer<typeof IncomingMessage, typeof import('http').ServerResponse>;

    /**
     * @desc Closes the server
     * @param callback - the callback to call when the server is closed
     */
    close (callback?: () => void): HTTPServer<typeof IncomingMessage, typeof import('http').ServerResponse>;

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
    createEndpoint (path: PondPath, handler: EndpointHandler): Endpoint;

    /**
     * @desc Adds a middleware function to the socket server
     * @param middleware - the middleware function to add
     */
    use (middleware: SocketMiddlewareFunction): void;
}

/**
 * @desc Creates a pond socket server
 * @param app - The Express app to be used by the server
 * @constructor
 */
export declare const PondSocketFromExpress: (app: Express) => PondSocketExpressApp;

