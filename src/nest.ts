import { createServer } from 'http';

import {
    applyDecorators,
    Injectable,
    SetMetadata,
    DynamicModule, Provider,
// eslint-disable-next-line import/no-unresolved
} from '@nestjs/common';
// eslint-disable-next-line import/no-unresolved
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
import type {
    IncomingConnection,
    LeaveEvent,
    ParameterDecorator,
    ParamDecoratorCallback,
    EndpointMetadata, Constructor, Metadata, CanActivate,
} from './typedefs';
import { PondEvent } from './types';

const onJoinHandlerKey = Symbol('onJoinHandlerKey');
const onEventHandlerKey = Symbol('onEventHandlerKey');
const onConnectionHandlerKey = Symbol('onConnectionHandlerKey');
const channelInstanceKey = Symbol('channelInstanceKey');
const endpointInstanceKey = Symbol('endpointInstanceKey');
const channelClassKey = Symbol('channel');
const endpointClassKey = Symbol('endpoint');
const channelsClassKey = Symbol('channels');
const parametersKey = Symbol('generalParametersKey');
const pondGuardsKey = Symbol('pondGuardsKey');
const endpointGuardsKey = Symbol('endpointGuardsKey');

interface HandlerData<Req, Res> {
    path: string;
    value: (instance: unknown, moduleRef: ModuleRef, request: Req, response: Res) => Promise<void>;
}

interface ParamDecoratorMetadata {
    index: number;
    callback: (context: Context) => unknown | Promise<unknown>;
}

interface NestRequest {
    connection?: IncomingConnection<string>;
    joinRequest?: JoinRequest<string>;
    eventRequest?: EventRequest<string>;
    leveeEvent?: LeaveEvent;
}

interface NestResponse {
    connection?: ConnectionResponse;
    joinResponse?: JoinResponse;
    eventResponse?: EventResponse;
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

function manageClassData<A> (key: symbol, target: any) {
    return {
        get () {
            return (Reflect.getMetadata(key, target) ?? null) as A | null;
        },
        set (value: A) {
            Reflect.defineMetadata(key, value, target);
        },
    };
}

function manageMethodData<A> (key: symbol, target: any, propertyKey: string) {
    function getter () {
        return (Reflect.getMetadata(key, target, propertyKey) ?? null) as A | null;
    }

    return {
        get: getter,
        set (value: A) {
            Reflect.defineMetadata(key, value, target, propertyKey);
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
                moduleRef: ModuleRef,
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

function manageParameters (target: any, propertyKey: string) {
    const { get, set } = manageMethodData<ParamDecoratorMetadata[]>(
        parametersKey,
        target,
        propertyKey,
    );

    return {
        get () {
            return get() || [];
        },
        set (index: number, callback: (context: Context) => unknown | Promise<unknown>) {
            const handlers = get() || [];

            set([
                ...handlers,
                {
                    index,
                    callback,
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

export function PondGuards (...guards: Constructor<CanActivate>[]) {
    return (target: any, propertyKey?: string) => {
        if (propertyKey) {
            const { get, set } = manageMethodData<Constructor<CanActivate>[]>(
                pondGuardsKey,
                target,
                propertyKey,
            );

            set([...(get() ?? []), ...guards]);
        } else {
            const { get, set } = manageClassData<Constructor<CanActivate>[]>(
                pondGuardsKey,
                target,
            );

            set([...(get() ?? []), ...guards]);
        }
    };
}

async function resolveGuards (moduleRef: ModuleRef, context: Context) {
    const retrieveGuard = (Guard: Constructor<CanActivate>) => {
        try {
            return moduleRef.get(Guard, { strict: false });
        } catch (e) {
            console.warn(`Unable to resolve guard: ${Guard.name}, creating new instance, WARNING: this will not inject dependencies. To fix this, add the guard to the providers array of the PondSocketModule.`);

            return new Guard();
        }
    };

    const classGuards = context.retrieveClassData<Constructor<CanActivate>[]>(pondGuardsKey) ?? [];
    const methodGuards = context.retrieveMethodData<Constructor<CanActivate>[]>(pondGuardsKey) ?? [];
    const instances = [...classGuards, ...methodGuards].map((guard) => retrieveGuard(guard));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const promises = instances.map((instance) => instance.canActivate(context));
    const results = await Promise.all(promises);

    return results.every((result) => result);
}

class Context {
    private readonly data: Record<string, unknown> = {};

    // eslint-disable-next-line no-useless-constructor
    constructor (
        private readonly request: NestRequest,
        private readonly response: NestResponse,
        private readonly instance: any,
        private readonly propertyKey: string,
    ) {}

    get joinRequest () {
        return this.request.joinRequest ?? null;
    }

    get eventRequest () {
        return this.request.eventRequest ?? null;
    }

    get connection () {
        return this.request.connection ?? null;
    }

    get leveeEvent () {
        return this.request.leveeEvent ?? null;
    }

    get joinResponse () {
        return this.response.joinResponse ?? null;
    }

    get eventResponse () {
        return this.response.eventResponse ?? null;
    }

    get connectionResponse () {
        return this.response.connection ?? null;
    }

    get user () {
        return this.joinRequest?.user ?? this.eventRequest?.user ?? null;
    }

    get channel () {
        return this.joinRequest?.channel ?? this.eventRequest?.channel ?? null;
    }

    get presence () {
        return this.joinRequest?.presence ?? this.eventRequest?.presence ?? null;
    }

    get event () {
        if (this.connection) {
            const event: PondEvent<string> = {
                params: this.connection.params,
                query: this.connection.query,
                payload: {},
                event: 'CONNECTION',
            };

            return event;
        } else if (this.joinRequest || this.eventRequest) {
            return this.joinRequest?.event ?? this.eventRequest?.event ?? null;
        }

        return null;
    }

    retrieveClassData<A> (key: symbol) {
        return manageClassData<A>(key, this.instance.constructor).get();
    }

    retrieveMethodData<A> (key: symbol) {
        return manageMethodData<A>(key, this.instance, this.propertyKey).get();
    }

    addData (key: string, value: unknown) {
        this.data[key] = value;
    }

    getData (key: string) {
        return this.data[key] ?? null;
    }
}

function manageConnectionHandlers (target: any) {
    return manageHandlers<IncomingConnection<string>, ConnectionResponse>(
        onConnectionHandlerKey,
        target,
    );
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

function manageOnLeaveHandlers (target: any) {
    return manageHandlers<LeaveEvent, void>(onConnectionHandlerKey, target);
}

function manageChannelInstance (target: any) {
    return managePropertyData<PondChannel>(channelInstanceKey, target);
}

function manageEndpointInstance (target: any) {
    return managePropertyData<PondEndpoint>(endpointInstanceKey, target);
}

export function createParamDecorator<Input> (callback: ParamDecoratorCallback<Input>) {
    return (data: Input): ParameterDecorator => (target, propertyKey, index) => {
        const { set } = manageParameters(target, propertyKey as string);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        set(index, (context) => callback(data, context));
    };
}

function resolveParameters (context: Context) {
    const gottenValues = context.retrieveMethodData<ParamDecoratorMetadata[]>(
        parametersKey,
    ) ?? [];

    const values = gottenValues
        .map(({ callback, index }) => ({
            value: callback(context),
            index,
        }));

    return values
        .sort((a, b) => a.index - b.index)
        .map(({ value }) => value);
}

export function GetUserData () {
    return createParamDecorator((_, context) => {
        const userData = context.user;

        if (!userData) {
            throw new Error('Invalid decorator usage: GetUserData');
        }

        return userData;
    })(null);
}

export function GetInternalChannel () {
    return createParamDecorator((_, context) => {
        const channel = context.channel;

        if (!channel) {
            throw new Error('Invalid decorator usage: GetInternalChannel');
        }

        return channel;
    })(null);
}

export function GetUserPresences () {
    return createParamDecorator((_, context) => {
        const presences = context.presence;

        if (!presences) {
            throw new Error('Invalid decorator usage: GetUserPresences');
        }

        return presences;
    })(null);
}

export function GetConnectionRequest () {
    return createParamDecorator((_, context) => {
        const connection = context.connection;

        if (!connection) {
            throw new Error('Invalid decorator usage: GetConnectionRequest');
        }

        return connection;
    })(null);
}

export function GetConnectionResponse () {
    return createParamDecorator((_, context) => {
        const response = context.connectionResponse;

        if (!response) {
            throw new Error('Invalid decorator usage: GetConnectionResponse');
        }

        return response;
    })(null);
}

export function GetConnectionRequestId () {
    return createParamDecorator((_, context) => {
        const connection = context.connection;

        if (!connection) {
            throw new Error('Invalid decorator usage: GetConnectionRequestId');
        }

        return connection.id;
    })(null);
}

export function GetConnectionParams () {
    return createParamDecorator((_, context) => {
        const connection = context.connection;

        if (!connection) {
            throw new Error('Invalid decorator usage: GetConnectionParams');
        }

        return connection.params;
    })(null);
}

export function GetConnectionHeaders () {
    return createParamDecorator((_, context) => {
        const connection = context.connection;

        if (!connection) {
            throw new Error('Invalid decorator usage: GetConnectionHeaders');
        }

        return connection.headers;
    })(null);
}

export function GetConnectionQuery () {
    return createParamDecorator((_, context) => {
        const connection = context.connection;

        if (!connection) {
            throw new Error('Invalid decorator usage: GetConnectionQuery');
        }

        return connection.query;
    })(null);
}

export function GetJoinRequest () {
    return createParamDecorator((_, context) => {
        const joinRequest = context.joinRequest;

        if (!joinRequest) {
            throw new Error('Invalid decorator usage: GetJoinRequest');
        }

        return joinRequest;
    })(null);
}

export function GetJoinResponse () {
    return createParamDecorator((_, context) => {
        const joinResponse = context.joinResponse;

        if (!joinResponse) {
            throw new Error('Invalid decorator usage: GetJoinResponse');
        }

        return joinResponse;
    })(null);
}

export function GetJoinParams () {
    return createParamDecorator((_, context) => {
        const joinRequest = context.joinRequest;

        if (!joinRequest) {
            throw new Error('Invalid decorator usage: GetJoinParams');
        }

        return joinRequest.joinParams;
    })(null);
}

export function GetEventPayload () {
    return createParamDecorator((_, context) => {
        const payload = context.event?.payload;

        if (!payload) {
            throw new Error('Invalid decorator usage: GetEventPayload');
        }

        return payload;
    })(null);
}

export function GetEventParams () {
    return createParamDecorator((_, context) => {
        const params = context.event?.params;

        if (!params) {
            throw new Error('Invalid decorator usage: GetEventParams');
        }

        return params;
    })(null);
}

export function GetEventQuery () {
    return createParamDecorator((_, request) => {
        const query = request.event?.query;

        if (!query) {
            throw new Error('Invalid decorator usage: GetEventQuery');
        }

        return query;
    })(null);
}

export function GetEventResponse () {
    return createParamDecorator((_, context) => {
        const response = context.eventResponse;

        if (!response) {
            throw new Error('Invalid decorator usage: GetEventResponse');
        }

        return response;
    })(null);
}

export function GetEventRequest () {
    return createParamDecorator((_, context) => {
        const request = context.eventRequest;

        if (!request) {
            throw new Error('Invalid decorator usage: GetEventRequest');
        }

        return request;
    })(null);
}

export function GetLeaveEvent () {
    return createParamDecorator((_, context) => {
        const event = context.leveeEvent;

        if (!event) {
            throw new Error('Invalid decorator usage: GetLeaveEvent');
        }

        return event;
    })(null);
}

export function OnConnectionRequest () {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        const { set } = manageConnectionHandlers(target);

        set('', async (instance, moduleRef, request, response) => {
            try {
                const req: NestRequest = {
                    connection: request,
                };

                const res: NestResponse = {
                    connection: response,
                };

                const context = new Context(req, res, instance, propertyKey);

                const canProceed = await resolveGuards(moduleRef, context);

                if (canProceed) {
                    const data = await originalMethod.apply(
                        instance,
                        resolveParameters(context),
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
                } else {
                    response.reject('Unauthorized', 401);
                }
            } catch (error) {
                if (!response.hasResponded && error instanceof Error) {
                    response.reject(error.message);
                }
            }
        });
    };
}

export function OnJoinRequest () {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        const { set } = manageJoinHandlers(target);

        set('', async (instance, moduleRef, request, response) => {
            try {
                const req: NestRequest = {
                    joinRequest: request,
                };

                const res: NestResponse = {
                    joinResponse: response,
                };

                const context = new Context(req, res, instance, propertyKey);

                const canProceed = await resolveGuards(moduleRef, context);

                if (canProceed) {
                    const data = await originalMethod.apply(
                        instance,
                        resolveParameters(context),
                    );

                    if (!response.hasResponded) {
                        if (data) {
                            const {
                                event,
                                presence,
                                assigns,
                                ...rest
                            } = data;

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
                } else {
                    response.reject('Unauthorized', 401);
                }
            } catch (error) {
                if (!response.hasResponded && error instanceof Error) {
                    response.reject(error.message);
                }
            }
        });
    };
}

export function OnEvent (event = '*') {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        const { set } = manageEventHandlers(target);

        set(event, async (instance, moduleRef, request, response) => {
            try {
                const req: NestRequest = {
                    eventRequest: request,
                };

                const res: NestResponse = {
                    eventResponse: response,
                };

                const context = new Context(req, res, instance, propertyKey);

                const canProceed = await resolveGuards(moduleRef, context);

                if (canProceed) {
                    const data = await originalMethod.apply(
                        instance,
                        resolveParameters(context),
                    );

                    if (!response.hasResponded) {
                        if (data) {
                            const {
                                event,
                                presence,
                                updatePresence,
                                assigns,
                                ...rest
                            } = data;

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
                } else {
                    response.reject('Unauthorized', 401);
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

        set('', async (instance, _, event) => {
            try {
                const context = new Context(
                    {
                        leveeEvent: event,
                    },
                    {},
                    instance,
                    propertyKey,
                );

                await originalMethod.apply(
                    instance,
                    resolveParameters(context),
                );
            } catch (error) {
                if (error instanceof Error) {
                    console.error(error.message);
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

const setEndpoint = (path = '*') => createClassDecorator(endpointClassKey, path);

const setGuards = (guards: Constructor<CanActivate>[]) => createClassDecorator(endpointGuardsKey, guards);

const setChannels = (channels: Constructor<NonNullable<unknown>>[]) => createClassDecorator(channelsClassKey, channels);

const getChannels = (target: any) => manageClassData<Constructor<NonNullable<unknown>>[]>(
    channelsClassKey,
    target,
).get() ?? [];

const getGuards = (target: any) => {
    const classGuards = manageClassData<Constructor<CanActivate>[]>(
        pondGuardsKey,
        target,
    ).get() ?? [];

    const methodGuards = Object.getOwnPropertyNames(target.prototype)
        .map((propertyKey) => manageMethodData<Constructor<CanActivate>[]>(
            pondGuardsKey,
            target.prototype,
            propertyKey,
        ).get() ?? []);

    return [...classGuards, ...methodGuards.flat()];
};

export const Endpoint = (metadata: EndpointMetadata) => applyDecorators(
    setChannels(metadata.channels),
    setEndpoint(metadata.path),
    setGuards(metadata.guards ?? []),
);

class PondSocketService {
    constructor (
        readonly moduleRef: ModuleRef,
        readonly adapterHost: HttpAdapterHost,
        private readonly endpoints: Constructor<NonNullable<unknown>>[],
    ) {
        const httpAdapter = this.adapterHost.httpAdapter;

        httpAdapter.listen = (...args: any[]) => {
            const app = httpAdapter.getInstance();
            const server = createServer(app);
            const socket = new PondSocket(server);

            this.endpoints.forEach((endpoint) => this.manageEndpoint(socket, endpoint));

            return socket.listen(...args);
        };
    }

    manageEndpoint (
        socket: PondSocket,
        endpoint: Constructor<NonNullable<Record<string, unknown>>>,
    ) {
        const endpointMetadata = manageClassData<string>(
            endpointClassKey,
            endpoint,
        ).get();

        if (!endpointMetadata) {
            return;
        }

        const endpointGuards = manageClassData<Constructor<CanActivate>[]>(
            endpointGuardsKey,
            endpoint,
        ).get() ?? [];

        const instance = this.moduleRef.get(endpoint, { strict: false });
        const { set } = manageEndpointInstance(instance);

        const pondEndpoint = socket.createEndpoint(
            endpointMetadata,
            async (request, response) => {
                const { get } = manageConnectionHandlers(instance);
                const [handler] = get();

                if (handler) {
                    await handler.value(instance, this.moduleRef, request, response);
                } else {
                    response.accept();
                }
            },
        );

        set(pondEndpoint);

        getChannels(endpoint).forEach((channel) => {
            this.manageChannel(channel, endpointGuards, pondEndpoint);
        });
    }

    manageChannel (
        channel: Constructor<NonNullable<Record<string, unknown>>>,
        guards: Constructor<CanActivate>[],
        endpoint: PondEndpoint,
    ) {
        const channelMetadata = manageClassData<string>(channelClassKey, channel).get();

        if (!channelMetadata) {
            return;
        }

        const { get, set: setGuards } = manageClassData<Constructor<CanActivate>[]>(
            pondGuardsKey,
            channel,
        );

        setGuards([...guards, ...(get() ?? [])]);

        const instance = this.moduleRef.get(channel, { strict: false });

        const channelInstance = endpoint.createChannel(
            channelMetadata,
            async (request, response) => {
                const { get } = manageJoinHandlers(instance);
                const [handler] = get();

                if (handler) {
                    await handler.value(instance, this.moduleRef, request, response);
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
                await handler.value(instance, this.moduleRef, request, response);
            });
        });

        const [leaveHandler] = getLeaveHandlers();

        if (leaveHandler) {
            channelInstance.onLeave(async (event) => {
                await leaveHandler.value(instance, this.moduleRef, event);
            });
        }

        set(channelInstance);
    }
}

export class PondSocketModule {
    static forRoot ({
        endpoints,
        providers = [],
        imports = [],
        exports = [],
        isGlobal = false,
    }: Metadata): DynamicModule {
        const endpointsSet = new Set(endpoints);
        const channels = Array.from(endpointsSet).flatMap((endpoint) => getChannels(endpoint));
        const channelsSet = new Set(channels);

        const guards = Array.from(new Set([...endpointsSet, ...channelsSet])).flatMap(((target) => getGuards(target)));
        const guardsSet = new Set(guards);

        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            useFactory: (moduleRef: ModuleRef, adapterHost: HttpAdapterHost) => new PondSocketService(
                moduleRef,
                adapterHost,
                endpoints,
            ),
            inject: [ModuleRef, HttpAdapterHost],
        };

        const providersSet = new Set([...providers, ...guardsSet, ...channelsSet, ...endpointsSet, pondSocketProvider]);

        return {
            imports,
            module: PondSocketModule,
            providers: [...providersSet],
            exports: [...exports, ...channelsSet],
            global: isGlobal,
        };
    }
}

