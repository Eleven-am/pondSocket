import { createServer } from 'http';

import {
    applyDecorators,
    Injectable,
    Module,
    ModuleMetadata,
    SetMetadata,
} from '@nestjs/common';
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';

import 'reflect-metadata';

import { EventRequest } from './channel/eventRequest';
import { EventResponse } from './channel/eventResponse';
import { Endpoint as PondEndpoint } from './endpoint/endpoint';
import { ConnectionResponse } from './endpoint/response';
import { JoinRequest } from './lobby/joinRequest';
import { JoinResponse } from './lobby/joinResponse';
import { PondChannel } from './lobby/lobby';
import { PondSocket } from './server/pondSocket';
import type { IncomingConnection, LeaveEvent } from './typedefs';

const joinRequestKey = Symbol('joinRequestKey');
const joinResponseKey = Symbol('joinResponseKey');
const joinParamsKey = Symbol('joinParamsKey');
const userDataKey = Symbol('userDataKey');
const internalChannelKey = Symbol('internalChannelKey');
const userPresenceKey = Symbol('userPresenceKey');
const eventRequestKey = Symbol('eventRequestKey');
const eventPayloadKey = Symbol('eventPayloadKey');
const eventParamsKey = Symbol('eventParamsKey');
const eventQueryKey = Symbol('eventQueryKey');
const eventResponseKey = Symbol('eventResponseKey');
const connectionRequestKey = Symbol('connectionRequestKey');
const connectionResponseKey = Symbol('connectionResponseKey');
const connectionRequestIdKey = Symbol('connectionRequestIdKey');
const connectionParamsKey = Symbol('connectionParamsKey');
const connectionQueryKey = Symbol('connectionQueryKey');
const connectionHeadersKey = Symbol('connectionHeadersKey');
const onJoinHandlerKey = Symbol('onJoinHandlerKey');
const onEventHandlerKey = Symbol('onEventHandlerKey');
const onConnectionHandlerKey = Symbol('onConnectionHandlerKey');
const channelInstanceKey = Symbol('channelInstanceKey');
const endpointInstanceKey = Symbol('endpointInstanceKey');
const channelClassKey = Symbol('channel');
const endpointClassKey = Symbol('endpoint');
const channelsClassKey = Symbol('channels');
const endpointsClassKey = Symbol('endpoints');

type Constructor<T> = new (...args: any[]) => T;

interface EndpointsMetadata extends Omit<ModuleMetadata, 'controllers'> {
    endpoints: Constructor<NonNullable<unknown>>[];
    isGlobal?: boolean;
}

interface EndpointMetadata {
    path?: string;
    channels: Constructor<NonNullable<unknown>>[];
}

interface HandlerData<Req, Res> {
    path: string;
    value: (instance: unknown, request: Req, response: Res) => Promise<void>;
}

function isNotEmpty<TValue> (value: TValue | null | undefined): value is TValue {
    return value !== null &&
        value !== undefined &&
        value !== '' &&
        Object.keys(value).length !== 0;
}

function createClassDecorator<T> (key: symbol, value: T): ClassDecorator {
    // eslint-disable-next-line new-cap
    return applyDecorators(Injectable(), SetMetadata(key, value));
}

function getClassMetadata<T> (key: symbol, target: any): T | null {
    return Reflect.getMetadata(key, target) ?? null;
}

function createParamDecorator (key: symbol, error: string) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const existingParams = Reflect.getMetadata(key, target, propertyKey);

        if (existingParams) {
            throw new Error(error);
        }

        Reflect.defineMetadata(key, parameterIndex, target, propertyKey);
    };
}

function resolveParamDecorator (key: symbol, target: any, propertyKey: string) {
    const index = Reflect.getMetadata(key, target, propertyKey);

    if (typeof index !== 'number') {
        return null;
    }

    return index;
}

function manageClassData<A> (key: symbol, target: any) {
    return {
        get () {
            return Reflect.getMetadata(key, target) as A;
        },
        set (value: A) {
            Reflect.defineMetadata(key, value, target);
        },
    };
}

function manageHandlers<Request, Response> (key: symbol, target: any) {
    const { get, set } = manageClassData<HandlerData<Request, Response>[]>(
        key,
        target,
    );

    return {
        get () {
            return get() || [];
        },
        set (
            path: string,
            value: (
                instance: unknown,
                request: Request,
                response: Response,
            ) => Promise<void>,
        ) {
            const handlers = get() || [];

            set([
                ...handlers,
                {
                    path,
                    value,
                },
            ]);
        },
    };
}

function managePropertyData<A> (key: symbol, target: any) {
    function build <T> (propertyKey: string, callback?: (value: A) => A | T | null) {
        Object.defineProperty(target, propertyKey, {
            get () {
                const value = Reflect.getMetadata(key, this) as A;

                if (callback) {
                    return callback(value);
                }

                return value;
            },
            set () {
                throw new Error(`${propertyKey} is readonly`);
            },
            enumerable: true,
            configurable: true,
        });
    }

    function set (value: A) {
        Reflect.defineMetadata(key, value, target);
    }

    return {
        build,
        set,
    };
}

function manageJoinHandlers (target: any) {
    return manageHandlers<JoinRequest<string>, JoinResponse>(
        onJoinHandlerKey,
        target,
    );
}

function manageEventHandlers (target: any) {
    return manageHandlers<EventRequest<string>, EventResponse>(
        onEventHandlerKey,
        target,
    );
}

function manageConnectionHandlers (target: any) {
    return manageHandlers<IncomingConnection<string>, ConnectionResponse>(
        onConnectionHandlerKey,
        target,
    );
}

function manageOnLeaveHandlers (target: any) {
    return manageHandlers<LeaveEvent, void>(onConnectionHandlerKey, target);
}

function manageChannelInstance (target: any) {
    return managePropertyData<PondChannel>(channelInstanceKey, target);
}

function manageEndpointInstance (target: any) {
    return managePropertyData<PondEndpoint>(endpointInstanceKey, target);
}

export function GetJoinRequest () {
    return createParamDecorator(
        joinRequestKey,
        'JoinRequest decorator already applied',
    );
}

export function GetJoinResponse () {
    return createParamDecorator(
        joinResponseKey,
        'JoinResponse decorator already applied',
    );
}

export function GetJoinParams () {
    return createParamDecorator(
        joinParamsKey,
        'JoinParams decorator already applied',
    );
}

export function GetUserData () {
    return createParamDecorator(
        userDataKey,
        'UserData decorator already applied',
    );
}

export function GetInternalChannel () {
    return createParamDecorator(
        internalChannelKey,
        'InternalChannel decorator already applied',
    );
}

export function GetUserPresences () {
    return createParamDecorator(
        userPresenceKey,
        'UserPresence decorator already applied',
    );
}

export function GetEventPayload () {
    return createParamDecorator(
        eventPayloadKey,
        'EventPayload decorator already applied',
    );
}

export function GetEventParams () {
    return createParamDecorator(
        eventParamsKey,
        'EventParams decorator already applied',
    );
}

export function GetEventQuery () {
    return createParamDecorator(
        eventQueryKey,
        'EventQuery decorator already applied',
    );
}

export function GetEventResponse () {
    return createParamDecorator(
        eventResponseKey,
        'EventResponse decorator already applied',
    );
}

export function GetEventRequest () {
    return createParamDecorator(
        eventRequestKey,
        'EventRequest decorator already applied',
    );
}

export function GetConnectionRequest () {
    return createParamDecorator(
        connectionRequestKey,
        'ConnectionRequest decorator already applied',
    );
}

export function GetConnectionResponse () {
    return createParamDecorator(
        connectionResponseKey,
        'ConnectionResponse decorator already applied',
    );
}

export function GetConnectionRequestId () {
    return createParamDecorator(
        connectionRequestIdKey,
        'ConnectionRequestId decorator already applied',
    );
}

export function GetConnectionParams () {
    return createParamDecorator(
        connectionParamsKey,
        'ConnectionParams decorator already applied',
    );
}

export function GetConnectionHeaders () {
    return createParamDecorator(
        connectionHeadersKey,
        'ConnectionHeaders decorator already applied',
    );
}

export function GetConnectionQuery () {
    return createParamDecorator(
        connectionQueryKey,
        'ConnectionQuery decorator already applied',
    );
}

function resolveJoinParameters (
    request: JoinRequest<string>,
    response: JoinResponse,
    target: any,
    propertyKey: string,
) {
    const joinRequestIndex = resolveParamDecorator(
        joinRequestKey,
        target,
        propertyKey,
    );

    const joinParamsIndex = resolveParamDecorator(
        joinParamsKey,
        target,
        propertyKey,
    );

    const userDataIndex = resolveParamDecorator(userDataKey, target, propertyKey);

    const internalChannelIndex = resolveParamDecorator(
        internalChannelKey,
        target,
        propertyKey,
    );

    const eventParamsIndex = resolveParamDecorator(
        eventParamsKey,
        target,
        propertyKey,
    );

    const eventQueryIndex = resolveParamDecorator(
        eventQueryKey,
        target,
        propertyKey,
    );

    const JoinResponseIndex = resolveParamDecorator(
        joinResponseKey,
        target,
        propertyKey,
    );

    const array = [
        joinRequestIndex,
        joinParamsIndex,
        userDataIndex,
        internalChannelIndex,
        eventParamsIndex,
        eventQueryIndex,
        JoinResponseIndex,
    ].filter((index) => typeof index === 'number') as number[];

    const rejectedKeys = [
        eventPayloadKey,
        eventRequestKey,
        eventResponseKey,
        userPresenceKey,
        connectionRequestKey,
        connectionResponseKey,
        connectionRequestIdKey,
        connectionParamsKey,
        connectionQueryKey,
    ]
        .map((key) => resolveParamDecorator(key, target, propertyKey))
        .filter((index) => typeof index === 'number') as number[];

    if (rejectedKeys.length) {
        throw new Error(`Invalid parameter decorators: ${rejectedKeys.join(', ')}`);
    }

    return array
        .sort((a, b) => a - b)
        .map((index) => {
            switch (index) {
                case joinRequestIndex:
                    return request;
                case joinParamsIndex:
                    return request.joinParams;
                case userDataIndex:
                    return request.user;
                case internalChannelIndex:
                    return request.channel;
                case eventParamsIndex:
                    return request.event.params;
                case eventQueryIndex:
                    return request.event.query;
                case JoinResponseIndex:
                    return response;
                default:
                    throw new Error('Invalid parameter decorator');
            }
        });
}

function resolveEventParameters (
    request: EventRequest<string>,
    response: EventResponse,
    target: any,
    propertyKey: string,
) {
    const userDataIndex = resolveParamDecorator(userDataKey, target, propertyKey);

    const userPresenceIndex = resolveParamDecorator(
        userPresenceKey,
        target,
        propertyKey,
    );

    const internalChannelIndex = resolveParamDecorator(
        internalChannelKey,
        target,
        propertyKey,
    );

    const eventParamsIndex = resolveParamDecorator(
        eventParamsKey,
        target,
        propertyKey,
    );

    const eventQueryIndex = resolveParamDecorator(
        eventQueryKey,
        target,
        propertyKey,
    );

    const eventPayloadIndex = resolveParamDecorator(
        eventPayloadKey,
        target,
        propertyKey,
    );

    const eventResponseIndex = resolveParamDecorator(
        eventResponseKey,
        target,
        propertyKey,
    );

    const eventRequestIndex = resolveParamDecorator(
        eventRequestKey,
        target,
        propertyKey,
    );

    const array = [
        userDataIndex,
        internalChannelIndex,
        eventParamsIndex,
        eventQueryIndex,
        eventPayloadIndex,
        eventResponseIndex,
        eventRequestIndex,
        userPresenceIndex,
    ].filter((index) => typeof index === 'number') as number[];

    const rejectedKeys = [
        joinRequestKey,
        joinResponseKey,
        joinParamsKey,
        connectionRequestKey,
        connectionResponseKey,
        connectionRequestIdKey,
        connectionParamsKey,
        connectionQueryKey,
    ]
        .map((key) => resolveParamDecorator(key, target, propertyKey))
        .filter((index) => typeof index === 'number') as number[];

    if (rejectedKeys.length) {
        throw new Error(`Invalid parameter decorators: ${rejectedKeys.join(', ')}`);
    }

    return array
        .sort((a, b) => a - b)
        .map((index) => {
            switch (index) {
                case userDataIndex:
                    return request.user;
                case internalChannelIndex:
                    return request.channel;
                case eventParamsIndex:
                    return request.event.params;
                case eventQueryIndex:
                    return request.event.query;
                case eventPayloadIndex:
                    return request.event.payload;
                case eventResponseIndex:
                    return response;
                case eventRequestIndex:
                    return request;
                case userPresenceIndex:
                    return request.presence;
                default:
                    throw new Error('Invalid parameter decorator');
            }
        });
}

function resolveLeaveParameters (
    event: LeaveEvent,
    target: any,
    propertyKey: string,
) {
    const userDataIndex = resolveParamDecorator(userDataKey, target, propertyKey);

    const rejectedKeys = [
        joinRequestKey,
        joinResponseKey,
        joinParamsKey,
        connectionRequestKey,
        connectionResponseKey,
        connectionRequestIdKey,
        connectionParamsKey,
        connectionQueryKey,
        eventParamsKey,
        eventQueryKey,
        eventPayloadKey,
        eventResponseKey,
        eventRequestKey,
        userPresenceKey,
        internalChannelKey,
    ]
        .map((key) => resolveParamDecorator(key, target, propertyKey))
        .filter((index) => typeof index === 'number') as number[];

    if (rejectedKeys.length) {
        throw new Error(`Invalid parameter decorators: ${rejectedKeys.join(', ')}`);
    }

    if (userDataIndex === null) {
        return [];
    }

    return [event.assigns];
}

function resolveConnectionParameters (
    request: IncomingConnection<string>,
    response: ConnectionResponse,
    target: any,
    propertyKey: string,
) {
    const connectionRequestIndex = resolveParamDecorator(
        connectionRequestKey,
        target,
        propertyKey,
    );

    const connectionResponseIndex = resolveParamDecorator(
        connectionResponseKey,
        target,
        propertyKey,
    );

    const connectionRequestIdIndex = resolveParamDecorator(
        connectionRequestIdKey,
        target,
        propertyKey,
    );

    const connectionParamsIndex = resolveParamDecorator(
        connectionParamsKey,
        target,
        propertyKey,
    );

    const connectionQueryIndex = resolveParamDecorator(
        connectionQueryKey,
        target,
        propertyKey,
    );

    const connectionHeadersIndex = resolveParamDecorator(
        connectionHeadersKey,
        target,
        propertyKey,
    );

    const array = [
        connectionRequestIndex,
        connectionResponseIndex,
        connectionRequestIdIndex,
        connectionParamsIndex,
        connectionQueryIndex,
        connectionHeadersIndex,
    ].filter((index) => typeof index === 'number') as number[];

    const rejectedKeys = [
        joinRequestKey,
        joinResponseKey,
        joinParamsKey,
        userDataKey,
        internalChannelKey,
        eventParamsKey,
        eventQueryKey,
        eventPayloadKey,
        eventResponseKey,
        userPresenceKey,
        eventRequestKey,
    ]
        .map((key) => resolveParamDecorator(key, target, propertyKey))
        .filter((index) => typeof index === 'number') as number[];

    if (rejectedKeys.length) {
        throw new Error(`Invalid parameter decorators: ${rejectedKeys.join(', ')}`);
    }

    return array
        .sort((a, b) => a - b)
        .map((index) => {
            switch (index) {
                case connectionRequestIndex:
                    return request;
                case connectionResponseIndex:
                    return response;
                case connectionRequestIdIndex:
                    return request.id;
                case connectionParamsIndex:
                    return request.params;
                case connectionQueryIndex:
                    return request.query;
                case connectionHeadersIndex:
                    return request.headers;
                default:
                    throw new Error('Invalid parameter decorator');
            }
        });
}

export function OnJoinRequest () {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        const { set } = manageJoinHandlers(target);

        set('', async (instance, request, response) => {
            try {
                const data = await originalMethod.apply(
                    instance,
                    resolveJoinParameters(request, response, target, propertyKey),
                );

                if (!response.hasResponded) {
                    if (data) {
                        const { event, presence, assigns, ...rest } = data;

                        if (typeof event === 'string' && isNotEmpty(rest)) {
                            response.send(event, rest, assigns);
                        } else {
                            response.accept(typeof assigns === 'object' ? assigns : {});
                        }

                        if (presence) {
                            response.trackPresence(presence);
                        }
                    } else {
                        response.accept();
                    }
                }
            } catch (error) {
                if (!response.hasResponded && error instanceof Error) {
                    response.reject(error.message);
                }
            }
        });
    };
}

export function OnLeaveEvent () {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        const { set } = manageOnLeaveHandlers(target);

        set('', async (instance, event) => {
            try {
                await originalMethod.apply(
                    instance,
                    resolveLeaveParameters(event, target, propertyKey),
                );
            } catch (error) {
                if (error instanceof Error) {
                    console.error(error.message);
                }
            }
        });
    };
}

export function OnEvent (event = '*') {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        const { set } = manageEventHandlers(target);

        set(event, async (instance, request, response) => {
            try {
                const data = await originalMethod.apply(
                    instance,
                    resolveEventParameters(request, response, target, propertyKey),
                );

                if (!response.hasResponded) {
                    if (data) {
                        const { event, presence, updatePresence, assigns, ...rest } = data;

                        if (typeof event === 'string' && isNotEmpty(rest)) {
                            response.send(event, rest, assigns);
                        } else {
                            response.accept(typeof assigns === 'object' ? assigns : {});
                        }

                        if (presence) {
                            response.trackPresence(presence);
                        } else if (updatePresence) {
                            response.updatePresence(updatePresence);
                        }
                    } else {
                        response.accept();
                    }
                }
            } catch (error) {
                if (!response.hasResponded && error instanceof Error) {
                    response.reject(error.message);
                }
            }
        });
    };
}

export function OnConnectionRequest () {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        const { set } = manageConnectionHandlers(target);

        set('', async (instance, request, response) => {
            try {
                const data = await originalMethod.apply(
                    instance,
                    resolveConnectionParameters(request, response, target, propertyKey),
                );

                if (!response.hasResponded) {
                    if (data) {
                        const { event, assigns, ...rest } = data;

                        if (typeof event === 'string' && isNotEmpty(rest)) {
                            response.send(event, rest, assigns);
                        } else {
                            response.accept(typeof assigns === 'object' ? assigns : {});
                        }
                    } else {
                        response.accept();
                    }
                }
            } catch (error) {
                if (!response.hasResponded && error instanceof Error) {
                    response.reject(error.message);
                }
            }
        });
    };
}

export function ChannelInstance (name?: string) {
    return (target: any, propertyKey: string) => {
        const { build } = manageChannelInstance(target);

        build(propertyKey, (value) => {
            if (name) {
                return value.getChannel(name);
            }

            return value;
        });
    };
}

export function EndpointInstance () {
    return (target: any, propertyKey: string) => {
        const { build } = manageEndpointInstance(target);

        build(propertyKey);
    };
}

export const Channel = (path = '*') => createClassDecorator(channelClassKey, path);

const SetEndpoint = (path = '*') => createClassDecorator(endpointClassKey, path);

const SetChannels = (channels: Constructor<NonNullable<unknown>>[]) => createClassDecorator(channelsClassKey, channels);

const getChannels = (target: any) => getClassMetadata<Constructor<NonNullable<unknown>>[]>(
    channelsClassKey,
    target,
) ?? [];

// eslint-disable-next-line new-cap
export const Endpoint = (metadata: EndpointMetadata) => applyDecorators(SetChannels(metadata.channels), SetEndpoint(metadata.path));

export const Endpoints = ({
    endpoints,
    providers = [],
    imports = [],
    exports = [],
}: EndpointsMetadata) => (target: any) => {
    const channels = endpoints.flatMap((endpoint) => getChannels(endpoint));

    return applyDecorators(
        // eslint-disable-next-line new-cap
        SetMetadata(endpointsClassKey, endpoints),
        // eslint-disable-next-line new-cap
        Module({
            imports,
            providers: [...providers, ...endpoints, ...channels],
            exports: [...exports, ...channels],
        }),
    )(target);
};

export class PondSocketModule {
    constructor (
        readonly moduleRef: ModuleRef,
        readonly adapterHost: HttpAdapterHost,
    ) {
        const httpAdapter = this.adapterHost.httpAdapter;

        const endpoints = getClassMetadata<Constructor<NonNullable<unknown>>[]>(
            endpointsClassKey,
            this.constructor,
        ) ?? [];

        httpAdapter.listen = (...args: any[]) => {
            const app = httpAdapter.getInstance();
            const server = createServer(app);
            const socket = new PondSocket(server);

            endpoints.forEach((endpoint) => this.manageEndpoint(socket, endpoint));

            return socket.listen(...args);
        };
    }

    manageEndpoint (
        socket: PondSocket,
        endpoint: Constructor<NonNullable<Record<string, unknown>>>,
    ) {
        const endpointMetadata = getClassMetadata<string>(
            endpointClassKey,
            endpoint,
        );

        if (!endpointMetadata) {
            return;
        }

        const instance = this.moduleRef.get(endpoint, { strict: false });
        const { set } = manageEndpointInstance(instance);

        const pondEndpoint = socket.createEndpoint(
            endpointMetadata,
            async (request, response) => {
                const { get } = manageConnectionHandlers(instance);
                const [handler] = get();

                if (handler) {
                    await handler.value(instance, request, response);
                } else {
                    response.accept();
                }
            },
        );

        set(pondEndpoint);

        getChannels(endpoint).forEach((channel) => {
            this.manageChannel(channel, pondEndpoint);
        });
    }

    manageChannel (
        channel: Constructor<NonNullable<Record<string, unknown>>>,
        endpoint: PondEndpoint,
    ) {
        const channelMetadata = getClassMetadata<string>(channelClassKey, channel);

        if (!channelMetadata) {
            return;
        }

        const instance = this.moduleRef.get(channel, { strict: false });

        const channelInstance = endpoint.createChannel(
            channelMetadata,
            async (request, response) => {
                const { get } = manageJoinHandlers(instance);
                const [handler] = get();

                if (handler) {
                    await handler.value(instance, request, response);
                } else {
                    response.accept();
                }
            },
        );

        const { get: getEventHandlers } = manageEventHandlers(instance);
        const { get: getLeaveHandlers } = manageOnLeaveHandlers(instance);
        const { set } = manageChannelInstance(instance);

        getEventHandlers().forEach((handler) => {
            channelInstance.onEvent(handler.path, async (request, response) => {
                await handler.value(instance, request, response);
            });
        });

        const [leaveHandler] = getLeaveHandlers();

        if (leaveHandler) {
            channelInstance.onLeave(async (event) => {
                await leaveHandler.value(instance, event);
            });
        }

        set(channelInstance);
    }
}
