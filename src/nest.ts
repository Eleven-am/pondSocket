import { Server } from 'http';

import { Module } from '@nestjs/common';
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
import type { IncomingConnection } from './typedefs';

interface DecoratedChannel {
    _setEndpoint(endpoint: PondEndpoint): void;
}

interface DecoratedEndpoint {
    _setSocket(moduleRef: ModuleRef, socket: PondSocket): void;
}

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
const channelsKey = Symbol('channelsKey');
const endpointsKey = Symbol('endpointsKey');
const channelInstanceKey = Symbol('channelInstanceKey');

type Constructor<T> = new (...args: any[]) => T;

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

function createClassDecorator<A> (key: symbol, target: any) {
    return {
        get () {
            return (Reflect.getMetadata(key, target) || []) as Constructor<A>[];
        },
        set (value: Constructor<A>[]) {
            Reflect.defineMetadata(key, value, target);
        },
    };
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

interface HandlerData<Req, Res> {
    path: string;
    value: (request: Req, response: Res) => Promise<void>;
}

function manageHandlers<Request, Response> (key: symbol, target: any) {
    const { get, set } = manageClassData<HandlerData<Request, Response>[]>(key, target);

    return {
        get () {
            return get() || [];
        },
        set (path: string, value: (request: Request, response: Response) => Promise<void>) {
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

function manageChannelInstance (target: any) {
    return manageClassData<PondChannel>(channelInstanceKey, target);
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

function manageChannels (target: any) {
    return createClassDecorator<DecoratedChannel>(channelsKey, target);
}

function manageEndpoints (target: any) {
    return createClassDecorator<DecoratedEndpoint>(endpointsKey, target);
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

export function GetUserPresence () {
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
    ].filter((index) => typeof index === 'number') as number[];

    const rejectedKeys = [
        joinRequestKey,
        joinResponseKey,
        joinParamsKey,
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
                default:
                    throw new Error('Invalid parameter decorator');
            }
        });
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
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) => {
        const originalMethod = descriptor.value;
        const { set } = manageJoinHandlers(target);

        set('', async (request, response) => {
            try {
                const data = await originalMethod.apply(
                    target,
                    resolveJoinParameters(request, response, target, propertyKey),
                );

                if (!response.hasResponded) {
                    if (data) {
                        const { event, ...rest } = data;

                        response.send(event ?? 'response', rest);
                    } else {
                        response.accept();
                    }
                }
            } catch (error) {
                response.reject(String(error));
            }
        });
    };
}

export function OnEvent (event = '*') {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) => {
        const originalMethod = descriptor.value;
        const { set } = manageEventHandlers(target);

        set(event, async (request, response) => {
            try {
                const data = await originalMethod.apply(
                    target,
                    resolveEventParameters(request, response, target, propertyKey),
                );

                if (!response.hasResponded) {
                    if (data) {
                        const { event, ...rest } = data;

                        response.send(event ?? 'response', rest);
                    } else {
                        response.accept();
                    }
                }
            } catch (error) {
                response.reject(String(error));
            }
        });
    };
}

export function OnConnectionRequest () {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) => {
        const originalMethod = descriptor.value;

        const { set } = manageConnectionHandlers(target);

        set('', async (request, response) => {
            try {
                const data = await originalMethod.apply(
                    target,
                    resolveConnectionParameters(request, response, target, propertyKey),
                );

                if (!response.hasResponded) {
                    if (data) {
                        const { event, ...rest } = data;

                        response.send(event ?? 'response', rest);
                    } else {
                        response.accept();
                    }
                }
            } catch (error) {
                response.reject(String(error));
            }
        });
    };
}

export function Channel<T extends Constructor<NonNullable<unknown>>> (
    path = '*',
) {
    return (constructor: T) => class extends constructor {
        _setEndpoint (endpoint: PondEndpoint) {
            const channel = endpoint.createChannel(
                path,
                async (request, response) => {
                    const { get } = manageJoinHandlers(this);
                    const [handler] = get();

                    if (handler) {
                        await handler.value(request, response);
                    } else {
                        response.accept();
                    }
                },
            );

            const { set } = manageChannelInstance(constructor.prototype);
            const { get } = manageEventHandlers(this);

            set(channel);
            get().forEach((handler) => {
                channel.onEvent(handler.path, async (request, response) => {
                    await handler.value(request, response);
                });
            });
        }
    };
}

export function ChannelInstance () {
    return (target: any, propertyKey: string) => {
        const { get } = manageChannelInstance(target.constructor.prototype);

        Object.defineProperty(target, propertyKey, {
            get () {
                return get();
            },
            set () {
                throw new Error('ChannelInstance is readonly');
            },
        });
    };
}

export function Channels<T extends Constructor<NonNullable<unknown>>> (
    channels: Constructor<NonNullable<unknown>>[],
) {
    return (constructor: T) => {
        const { set } = manageChannels(constructor.prototype);

        set(channels as Constructor<DecoratedChannel>[]);

        return constructor;
    };
}

export function Endpoint<T extends Constructor<NonNullable<unknown>>> (
    path = '*',
) {
    return (constructor: T) => class extends constructor {
        _setSocket (moduleRef: ModuleRef, socket: PondSocket) {
            const { get } = manageConnectionHandlers(this);
            const { get: getChannels } = manageChannels(this);
            const [handler] = get();

            const endpoint = socket.createEndpoint(
                path,
                async (request, response) => {
                    if (handler) {
                        await handler.value(request, response);
                    } else {
                        response.accept();
                    }
                },
            );

            getChannels().forEach((channel) => {
                const chan = moduleRef.get(channel, {
                    strict: false,
                });

                chan._setEndpoint(endpoint);
            });
        }
    };
}

export function Endpoints<T extends Constructor<NonNullable<unknown>>> (endpoints: Constructor<NonNullable<unknown>>[]) {
    return (constructor: T) => {
        const channels = endpoints.reduce((acc, endpoint) => {
            const { get } = manageChannels(endpoint.prototype);
            const channels = get();

            return [...acc, ...channels];
        }, [] as Constructor<DecoratedChannel>[]);

        const { set } = manageEndpoints(constructor.prototype);

        set(endpoints as Constructor<DecoratedEndpoint>[]);

        // eslint-disable-next-line new-cap
        return Module({
            providers: [...endpoints, ...channels],
            exports: [...endpoints, ...channels],
        })(constructor);
    };
}

export class PondSocketModule {
    private readonly socket: PondSocket;

    constructor (
        readonly moduleRef: ModuleRef,
        readonly adapterHost: HttpAdapterHost,
    ) {
        const expressInstance = this.adapterHost.httpAdapter;
        const server: Server = expressInstance.getHttpServer();

        this.socket = new PondSocket(server);

        expressInstance.listen = (...args: any[]) => {
            const { get } = manageEndpoints(this);

            get().map((endpoint) => {
                const instance = this.moduleRef.get(endpoint, { strict: false });

                instance._setSocket(this.moduleRef, this.socket);

                return instance;
            });
            this.socket.listen(...args);
        };
    }
}
