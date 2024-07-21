import type {
    Channel as PondChannel,
    ConnectionResponse,
    EventRequest,
    EventResponse,
    IncomingConnection,
    JoinRequest,
    JoinResponse,
    LeaveEvent,
    PondAssigns,
    PondEvent,
    PondEvenType,
    PondMessage,
    PondPresence,
    UserData,
} from '@eleven-am/pondsocket/types';
import type { DynamicModule, ModuleMetadata } from '@nestjs/common';

type Constructor<T> = new (...args: any[]) => T;

type ParamDecoratorCallback<Input, ParamType> = (data: Input, context: Context, type: ParamType) => unknown | Promise<unknown>;

interface CanActivate {

    /**
     * @desc Whether the client can continue with the request
     * @param context - The context of the request
     */
    canActivate(context: Context): boolean | Promise<boolean>;
}

interface Metadata extends Omit<ModuleMetadata, 'controllers'> {
    guards?: Constructor<CanActivate>[];
    appModuleName?: string;
    isGlobal?: boolean;
}

type NestFuncType<Event extends string, Payload extends PondMessage, Presence extends PondPresence, Assigns extends PondAssigns = PondAssigns> = {
    event?: Event;
    broadcast?: Event;
    broadcastFrom?: Event;
    assigns?: Partial<Assigns>;
    presence?: Presence;
    subscribeTo?: string[];
    unsubscribeFrom?: string[];
} & Payload;

type PondResponse<EventType extends PondEvenType = PondEvenType, Event extends keyof EventType = string, Presence extends PondPresence = PondPresence, Assigns extends PondAssigns = PondAssigns> =
    Event extends string ?
        EventType[Event] extends [PondMessage, PondMessage] ? NestFuncType<Event, EventType[Event][1], Presence, Assigns> :
            EventType[Event] extends PondMessage ? NestFuncType<Event, EventType[Event], Presence, Assigns> :
                never :
        never;

declare class Context<Path extends string = string, Event extends PondEvenType = PondEvenType, Presence extends PondPresence = PondPresence, Assigns extends PondAssigns = PondAssigns> {
    /**
     * @desc The request object, available in onJoin handlers
     */
    get joinRequest (): JoinRequest<Path, Presence, Assigns> | null;

    /**
     * @desc The request object, available in onEvent handlers
     */
    get eventRequest (): EventRequest<Path, Presence, Assigns> | null;

    /**
     * @desc The request object, available in onConnection handlers
     */
    get connection (): IncomingConnection<Path> | null;

    /**
     * @desc The request object, available in onLeave handlers
     */
    get leaveEvent (): LeaveEvent | null;

    /**
     * @desc The response object, available in onJoin handlers
     */
    get joinResponse (): JoinResponse<Event, Presence, Assigns> | null;

    /**
     * @desc The response object, available in onEvent handlers
     */
    get eventResponse (): EventResponse<Event, Presence, Assigns> | null;

    /**
     * @desc The response object, available in onConnection handlers
     */
    get connectionResponse (): ConnectionResponse | null;

    /**
     * @desc The presence object, available on the channel
     */
    get presence (): Presence;

    /**
     * @desc The assigns object, available on the channel
     */
    get assigns (): Assigns;

    /**
     * @desc The user object, assigned to the current user
     */
    get user (): UserData<Presence, Assigns> | null;

    /**
     * @desc The channel object handling the request
     */
    get channel (): PondChannel<Event, Presence, Assigns> | null;

    /**
     * @desc The event object of the current the request
     */
    get event (): PondEvent<Path> | null;

    /**
     * @desc The class reference of the current context
     */
    getClass (): any;

    /**
     * @desc The method reference of the current context
     */
    getHandler (): any;

    /**
     * @desc The instance reference of the current context
     */
    getInstance(): any;

    /**
     * @desc The path of the current context
     */
    getMethod(): string;

    /**
     * @desc Saves data to the current context
     */
    addData <Type> (key: string, value: Type): void;

    /**
     * @desc Retrieves data from the current context
     */
    getData <Type> (key: string): Type | null;
}

/**
 * @desc Decorator that marks a class as a channel
 */
declare function Channel(path?: string): ClassDecorator

/**
 * @desc Decorator that marks a property on a class as the channel instance
 * @returns {Channel | PondChannel}
 */
declare function ChannelInstance(channel?: string): PropertyDecorator;

/**
 * @desc Decorator that marks a class as an endpoint
 */
declare function Endpoint(path?: string): ClassDecorator;

/**
 * @desc Decorator that marks a property on a class as the endpoint instance
 * @returns {Endpoint}
 */
declare function EndpointInstance(): PropertyDecorator;

/**
 * @desc Parameter decorator that retrieves the current channel
 * @returns {Channel}
 */
declare const GetChannel: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current connection headers
 * @returns {IncomingHttpHeaders}
 */
declare const GetConnectionHeaders: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current connection request
 * @returns {IncomingConnection}
 */
declare const GetConnectionRequest: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current connection response
 * @returns {ConnectionResponse}
 */
declare const GetConnectionResponse: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current context
 * @returns {Context}
 */
declare const GetContext: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current event params
 * @returns {Params}
 */
declare const GetEventParams: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current event payload
 * @returns {PondMessage}
 */
declare const GetEventPayload: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current event query
 * @returns {Record<string, string>}
 */
declare const GetEventQuery: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current event request
 * @returns {EventRequest}
 */
declare const GetEventRequest: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current event response
 * @returns {EventResponse}
 */
declare const GetEventResponse: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current join params
 * @returns {JoinParams}
 */
declare const GetJoinParams: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current join request
 * @returns {JoinRequest}
 */
declare const GetJoinRequest: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current join response
 * @returns {JoinResponse}
 */
declare const GetJoinResponse: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current leave event
 * @returns {LeaveEvent}
 */
declare const GetLeaveEvent: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current user
 * @returns {UserData}
 */
declare const GetUserData: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current user presences
 * @returns {PondAssigns}
 */
declare const GetUserAssigns: () => ParameterDecorator;

/**
 * @desc Parameter decorator that retrieves the current user presences
 * @returns {PondPresence}
 */
declare const GetUserPresence: () => ParameterDecorator;

/**
 * @desc Method decorator that marks a method as an onConnection handler
 */
declare function OnConnectionRequest(): MethodDecorator;

/**
 * @desc Method decorator that marks a method as an onEvent handler
 */
declare function OnEvent<EventType extends PondEvenType = PondEvenType>(path?: keyof EventType): MethodDecorator;

/**
 * @desc Method decorator that marks a method as an onJoin handler
 */
declare function OnJoinRequest(): MethodDecorator;

/**
 * @desc Method decorator that marks a method as an onLeave handler
 */
declare function OnLeave(): MethodDecorator;

/**
 * @desc Decorator that adds guards to a channel's or endpoint's class or method
 * @param guards - The guards to add. It is important to add the guards to a providers array in any module (only necessary if the guards inject dependencies)
 */
declare function PondGuards (...guards: Constructor<CanActivate>[]): ClassDecorator | MethodDecorator;

/**
 * @desc Helper function that creates a parameter decorator
 * @param callback - The callback to run when the parameter is being retrieved
 */
declare function createParamDecorator<Input, ParamType> (callback: ParamDecoratorCallback<Input, ParamType>): (data: Input) => ParameterDecorator;

declare class PondSocketModule {
    static forRoot({ guards, providers, imports, exports, isGlobal, appModuleName }: Metadata): DynamicModule;
}

