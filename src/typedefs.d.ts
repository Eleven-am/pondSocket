import { Server as HTTPServer, IncomingHttpHeaders } from 'http';

import type { ModuleMetadata, DynamicModule } from '@nestjs/common';
import type { Express } from 'express';
import { WebSocketServer } from 'ws';

type Unsubscribe = () => void;

type Constructor<T> = new (...args: any[]) => T;
declare type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
declare type MethodDecorator = <T>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
declare type ParameterDecorator = (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => void;

export type default_t<T = any> = Record<string, T>;
type IsParam<Path> = Path extends `:${infer Param}` ? Param : never;

type FilteredParams<Path> = Path extends `${infer First}/${infer Second}`
    ? IsParam<First> | FilteredParams<Second>
    : IsParam<Path>

/**
 * @desc The type for the params in a request
 * @typeParam Path - The path to get the params from
 * @example
 *
 * const params: Params<'/api/:id'> = {
 *    id: '123',
 *    foo: 'bar', // Error: Type 'string' is not assignable to type 'undefined'
 * }
 */
type Params<Path> = {
    [Key in FilteredParams<Path>]: string
}

interface EndpointMetadata {
    path?: string;
    channels: Constructor<NonNullable<unknown>>[];
}

type PondPath<Path extends string> = Path | RegExp;

type EventParams<Path> = {
    query: Record<string, string>;
    params: Params<Path>;
}

type PondObject = default_t;
type PondPresence = PondObject;
type PondMessage = PondObject;
type PondAssigns = PondObject;
type JoinParams = PondObject;

interface PresencePayload {
    changed: PondPresence;
    presence: PondPresence[];
}

interface UserPresences {
    [userId: string]: PondPresence;
}

interface UserAssigns {
    [userId: string]: PondAssigns;
}

interface Metadata extends Omit<ModuleMetadata, 'controllers'> {
    endpoints: Constructor<NonNullable<unknown>>[];
    isGlobal?: boolean;
}

type PondEvent<Path> = EventParams<Path> & {
    payload: PondMessage;
    event: string;
}

type IncomingConnection<Path> = EventParams<Path> & {
    id: string;
    headers: IncomingHttpHeaders;
    address: string;
}

interface LeaveEvent {
    userId: string;
    assigns: PondAssigns;
}

type LeaveCallback = (event: LeaveEvent) => void;

type ParamDecoratorCallback<Input> = (data: Input, context: Context) => unknown | Promise<unknown>;

interface UserData {
    assigns: PondAssigns;
    presence: PondPresence;
    id: string;
}

export interface CanActivate {

    /**
     * @desc Whether the client can continue with the request
     * @param context - The context of the request
     */
    canActivate(context: Context): boolean | Promise<boolean>;
}

export enum ChannelState {
    IDLE = 'IDLE',
    JOINING = 'JOINING',
    JOINED = 'JOINED',
    STALLED = 'STALLED',
    CLOSED = 'CLOSED',
}

declare class Context {
    /**
     * @desc The request object, available in onJoin handlers
     */
    joinRequest: JoinRequest<string> | null;

    /**
     * @desc The request object, available in onEvent handlers
     */
    eventRequest: EventRequest<string> | null;

    /**
     * @desc The request object, available in onConnection handlers
     */
    connection: IncomingConnection<string> | null;

    /**
     * @desc The leave event, available in onLeave handlers
     */
    leveeEvent: LeaveEvent | null;

    /**
     * @desc The response object, available in onJoin handlers
     */
    joinResponse: JoinResponse | null;

    /**
     * @desc The response object, available in onEvent handlers
     */
    eventResponse: EventResponse | null;

    /**
     * @desc The response object, available in onConnection handlers
     */
    connectionResponse: ConnectionResponse | null;

    /**
     * @desc The user data, available in onJoin, onEvent handlers
     */
    user: UserData | null;

    /**
     * @desc The channel, available in onJoin, onEvent handlers
     */
    channel: Channel | null;

    /**
     * @desc The assigns, available in onJoin, onEvent handlers
     */
    presence: UserPresences | null;

    /**
     * @desc The assigns, available in onJoin, onEvent handlers
     */
    event: EventParams<string> | null;

    /**
     * @desc Retrieves metadata associated with the class
     * @param key - the key to retrieve
     */
    public retrieveClassData<A = unknown>(key: symbol): A | null;

    /**
     * @desc Retrieves metadata associated with the method
     * @param key - the key to retrieve
     */
    public retrieveMethodData<A = unknown>(key: symbol): A | null;

    /**
     * @desc Adds request data to the context
     * @param key - the key to add
     * @param value - the value to add
     */
    public addData(key: string, value: unknown): void;

    /**
     * @desc Retrieves request data from the context
     * @param key - the key to retrieve
     */
    public getData<A = unknown>(key: string): A | null;
}

declare class AbstractRequest<Path extends string> {
    event: PondEvent<Path>;

    channelName: string;

    assigns: UserAssigns;

    presence: UserPresences;
}

declare abstract class PondResponse {
    /**
     * @desc Whether the server has responded to the request
     */
    public abstract hasResponded: boolean;

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

declare class EventRequest<Path extends string> extends AbstractRequest<Path> {
    user: UserData;

    channel: Channel;
}

declare class EventResponse extends PondResponse {
    /**
     * @desc Whether the server has responded to the request
     */
    hasResponded: boolean;

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

export declare class ClientChannel {
    channelState: ChannelState;

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

declare class Endpoint {
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

export declare class Channel {
    /**
     * The name of the channel.
     */
    name: string;

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
     * @desc Sends a message to specific clients in the channel.
     * @param userIds - The ids of the users to send the message to.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    sendToUsers (userIds: string[], event: string, payload: PondMessage): void;

    /**
     * @desc Bans a user from the channel.
     * @param userId - The id of the user to ban.
     * @param reason - The reason for the ban.
     */
    evictUser (userId: string, reason?: string): void;

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

declare class JoinRequest<Path extends string> extends AbstractRequest<Path> {
    joinParams: JoinParams;

    user: UserData;

    channel: Channel;
}

declare class JoinResponse extends PondResponse {
    /**
     * @desc Whether the server has responded to the request
     */
    hasResponded: boolean;

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

declare class ConnectionResponse extends PondResponse {
    /**
     * @desc Whether the server has responded to the request
     */
    hasResponded: boolean;

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

    /**
     * @desc Handles the leave event for a user, can occur when a user disconnects or leaves a channel, use this to clean up any resources
     * @param callback - The callback to execute when a user leaves
     */
    public onLeave (callback: LeaveCallback): void;

    /**
     * @desc Gets a channel by name
     * @param channelName - The name of the channel to get
     */
    public getChannel (channelName: string): Channel | null;
}

declare class PondSocket {
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
     *       return res.reject('No token provided');
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    upgrade<Path extends string> (path: PondPath<Path>, handler: (request: IncomingConnection<Path>, response: ConnectionResponse) => void | Promise<void>): Endpoint;
}

declare class PondClient {
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
    createChannel (name: string, params?: JoinParams): ClientChannel;

    /**
     * @desc Subscribes to the connection state.
     * @param callback - The callback to call when the state changes.
     */
    onConnectionChange (callback: (state: boolean) => void): Unsubscribe;
}

declare const pondSocket: (app: Express) => PondSocketExpressApp;

/**
 * @desc The Decorator for retrieving the JoinRequest object from the request in a handler
 * @returns {JoinRequest}
 */
declare function GetJoinRequest(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the JoinResponse object from the response in a handler
 * @returns {JoinResponse}
 */
declare function GetJoinResponse(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the JoinParams object from the request in a handler
 * @returns {JoinParams}
 */
declare function GetJoinParams(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the UserData object from the request in a handler
 * @returns {UserData}
 */
declare function GetUserData(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the Channel object from the request in a handler
 * @returns {Channel}
 */
declare function GetInternalChannel(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the UserPresences object from the request in a handler
 * @returns {UserPresences}
 */
declare function GetUserPresences(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the event payload from the request in a handler
 * @returns {PondMessage}
 */
declare function GetEventPayload(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the EventRequest Params object from the request in a handler
 * @returns {Params}
 */
declare function GetEventParams(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the EventRequest Query object from the request in a handler
 * @returns {Record<string, string>}
 */
declare function GetEventQuery(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the EventResponse in a handler
 * @returns {EventResponse}
 */
declare function GetEventResponse(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the EventRequest in a handler
 * @returns {EventRequest}
 */
declare function GetEventRequest(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the ConnectionReQuest in a handler
 * @returns {IncomingConnection}
 */
declare function GetConnectionRequest(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the ConnectionResponse in a handler
 * @returns {ConnectionResponse}
 */
declare function GetConnectionResponse(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the ConnectionRequestId in a handler
 * @returns {string}
 */
declare function GetConnectionRequestId(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the ConnectionParams in a handler
 * @returns {Params}
 */
declare function GetConnectionParams(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the ConnectionHeaders from the request in a handler
 * @returns {IncomingHttpHeaders}
 */
declare function GetConnectionHeaders(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the ConnectionQuery in a handler
 * @returns {Record<string, string>}
 */
declare function GetConnectionQuery(): ParameterDecorator;

/**
 * @desc The Decorator for retrieving the LeaveEvent in a handler
 * @returns {LeaveEvent}
 */
declare function GetLeaveEvent(): ParameterDecorator;

/**
 * @desc Function to create a param decorator
 * @param callback - The callback to call when the decorator is used
 * @returns {ReturnType<callback>}
 */
declare function createParamDecorator<Input> (callback: ParamDecoratorCallback<Input>): ParameterDecorator;

/**
 * @desc Marks a method as a handler for JoinRequest events. Throwing an error will reject the request with the error message.
 */
declare function OnJoinRequest(): MethodDecorator;

/**
 * @desc Marks a method as a handler for events with the specified name. Throwing an error will reject the request with the error message
 * @param event - The name of the event to handle.
 */
declare function OnEvent(event?: string): MethodDecorator;

/**
 * @desc Marks a method as a handler for Leave events. Useful for cleaning up resources when a user leaves.
 */
declare function OnLeaveEvent (): MethodDecorator;

/**
 * @desc Marks a method as a handler for ConnectionRequest events. Throwing an error will reject the request with the error message.
 */
declare function OnConnectionRequest(): MethodDecorator;

/**
 * Decorator to mark a class as a channel.
 * @param path - The path for the channel (default is '*').
 */
declare function DChannel(path?: string): ClassDecorator;

/**
 * Decorator to retrieve the channel instance as a read-only property in a class.
 * It may either return an instance of the PondChannel if no name is provided otherwise an instance of Channel or null (depending on if a client is connected)
 * @param name - The name of the channel to return
 */
declare function ChannelInstance(name?: string): PropertyDecorator;

/**
 * Decorator to retrieve the endpoint instance as a read-only property in a class.
 */
declare function EndpointInstance (): PropertyDecorator;

/**
 * Decorator to mark a class as an endpoint.
 * @param metadata - The metadata for the endpoint.
 */
declare function DEndpoint(metadata: EndpointMetadata): ClassDecorator;

/**
 * Decorator to add a guard to a class or method.
 * @param guards - The guards to add.
 */
declare function PondGuards (...guards: Constructor<CanActivate>[]): MethodDecorator & ClassDecorator;

declare class PondSocketModule {
    /**
     * @desc Creates a new PondSocketModule
     * @param metadata - The metadata for the module
     */
    static forRoot (metadata: Metadata): DynamicModule;
}
