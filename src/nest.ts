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
    NestResponse, NestRequest, EndpointMetadata, Constructor, Metadata, CanActivate,
} from './typedefs';

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

interface HandlerData<Req, Res> {
    path: string;
    value: (instance: unknown, moduleRef: ModuleRef, request: Req, response: Res) => Promise<void>;
}

interface ParamDecoratorMetadata {
    index: number;
    callback: (request: NestRequest, response: NestResponse) => unknown | Promise<unknown>;
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

function manageMethodData<A> (key: symbol, target: any, propertyKey: string) {
    return {
        get () {
            return Reflect.getMetadata(key, target, propertyKey) as A;
        },
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
    function getter () {
        return Reflect.getMetadata(parametersKey, target, propertyKey) as ParamDecoratorMetadata[] ?? [];
    }

    return {
        get: getter,
        set (index: number, callback: (request: NestRequest, response: NestResponse) => unknown) {
            const handlers = getter();

            Reflect.defineMetadata(parametersKey, [
                ...handlers,
                {
                    index,
                    callback,
                },
            ], target, propertyKey);
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

            set([...get(), ...guards]);
        } else {
            const { get, set } = manageClassData<Constructor<CanActivate>[]>(
                pondGuardsKey,
                target,
            );

            set([...get(), ...guards]);
        }
    };
}

async function resolveGuards (moduleRef: ModuleRef, request: NestRequest, target: any, propertyKey: string) {
    const { get: getClassGuards } = manageClassData<Constructor<CanActivate>[]>(
        pondGuardsKey,
        target,
    );

    const { get: getMethodGuards } = manageMethodData<Constructor<CanActivate>[]>(
        pondGuardsKey,
        target,
        propertyKey.toString(),
    );

    const classGuards = getClassGuards() ?? [];
    const methodGuards = getMethodGuards() ?? [];
    const instances = [...classGuards, ...methodGuards].map((guard) => moduleRef.get(guard, { strict: false }));

    const promises = instances.map((instance) => instance.canActivate(request));
    const results = await Promise.all(promises);

    return results.every((result) => result);
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

        set(index, (request, response) => callback(data, request, response));
    };
}

function resolveParameters (
    request: NestRequest,
    response: NestResponse,
    target: any,
    propertyKey: string,
) {
    const { get } = manageParameters(target, propertyKey);

    const values = get()
        .map(({ callback, index }) => ({
            value: callback(request, response),
            index,
        }));

    return values
        .sort((a, b) => a.index - b.index)
        .map(({ value }) => value);
}

export function GetUserData () {
    return createParamDecorator((_, request) => {
        const { joinRequest, eventRequest } = request;

        if (joinRequest) {
            return joinRequest.user;
        } else if (eventRequest) {
            return eventRequest.user;
        }

        throw new Error('Invalid decorator usage: GetUserData');
    })(null);
}

export function GetInternalChannel () {
    return createParamDecorator((_, request) => {
        const { joinRequest, eventRequest } = request;

        if (joinRequest) {
            return joinRequest.channel;
        } else if (eventRequest) {
            return eventRequest.channel;
        }

        throw new Error('Invalid decorator usage: GetInternalChannel');
    })(null);
}

export function GetUserPresences () {
    return createParamDecorator((_, request) => {
        const { joinRequest, eventRequest } = request;

        if (joinRequest) {
            return joinRequest.presence;
        } else if (eventRequest) {
            return eventRequest.presence;
        }

        throw new Error('Invalid decorator usage: GetUserPresences');
    })(null);
}

export function GetConnectionRequest () {
    return createParamDecorator((_, request) => {
        const { connection } = request;

        if (connection) {
            return connection;
        }

        throw new Error('Invalid decorator usage: GetConnectionRequest');
    })(null);
}

export function GetConnectionResponse () {
    return createParamDecorator((_, __, response) => {
        const { connection } = response;

        if (connection) {
            return connection;
        }

        throw new Error('Invalid decorator usage: GetConnectionResponse');
    })(null);
}

export function GetConnectionRequestId () {
    return createParamDecorator((_, request) => {
        const { connection } = request;

        if (connection) {
            return connection.id;
        }

        throw new Error('Invalid decorator usage: GetConnectionRequestId');
    })(null);
}

export function GetConnectionParams () {
    return createParamDecorator((_, request) => {
        const { connection } = request;

        if (connection) {
            return connection.params;
        }

        throw new Error('Invalid decorator usage: GetConnectionParams');
    })(null);
}

export function GetConnectionHeaders () {
    return createParamDecorator((_, request) => {
        const { connection } = request;

        if (connection) {
            return connection.headers;
        }

        throw new Error('Invalid decorator usage: GetConnectionHeaders');
    })(null);
}

export function GetConnectionQuery () {
    return createParamDecorator((_, request) => {
        const { connection } = request;

        if (connection) {
            return connection.query;
        }

        throw new Error('Invalid decorator usage: GetConnectionQuery');
    })(null);
}

export function GetJoinRequest () {
    return createParamDecorator((_, request) => {
        const { joinRequest } = request;

        if (joinRequest) {
            return joinRequest;
        }

        throw new Error('Invalid decorator usage: GetJoinRequest');
    })(null);
}

export function GetJoinResponse () {
    return createParamDecorator((_, __, response) => {
        const { joinResponse } = response;

        if (joinResponse) {
            return joinResponse;
        }

        throw new Error('Invalid decorator usage: GetJoinResponse');
    })(null);
}

export function GetJoinParams () {
    return createParamDecorator((_, request) => {
        const { joinRequest } = request;

        if (joinRequest) {
            return joinRequest.joinParams;
        }

        throw new Error('Invalid decorator usage: GetJoinParams');
    })(null);
}

export function GetEventPayload () {
    return createParamDecorator((_, request) => {
        const { eventRequest } = request;

        if (eventRequest) {
            return eventRequest.event.payload;
        }

        throw new Error('Invalid decorator usage: GetEventPayload');
    })(null);
}

export function GetEventParams () {
    return createParamDecorator((_, request) => {
        const { eventRequest } = request;

        if (eventRequest) {
            return eventRequest.event.params;
        }

        throw new Error('Invalid decorator usage: GetEventParams');
    })(null);
}

export function GetEventQuery () {
    return createParamDecorator((_, request) => {
        const { eventRequest } = request;

        if (eventRequest) {
            return eventRequest.event.query;
        }

        throw new Error('Invalid decorator usage: GetEventQuery');
    })(null);
}

export function GetEventResponse () {
    return createParamDecorator((_, __, response) => {
        const { eventResponse } = response;

        if (eventResponse) {
            return eventResponse;
        }

        throw new Error('Invalid decorator usage: GetEventResponse');
    })(null);
}

export function GetEventRequest () {
    return createParamDecorator((_, request) => {
        const { eventRequest } = request;

        if (eventRequest) {
            return eventRequest;
        }

        throw new Error('Invalid decorator usage: GetEventRequest');
    })(null);
}

export function GetLeaveEvent () {
    return createParamDecorator((_, request) => {
        const { leveeEvent } = request;

        if (leveeEvent) {
            return leveeEvent;
        }

        throw new Error('Invalid decorator usage: GetLeaveEvent');
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

                const canProceed = await resolveGuards(moduleRef, req, target, propertyKey);

                if (canProceed) {
                    const data = await originalMethod.apply(
                        instance,
                        resolveParameters(req, res, target, propertyKey),
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    joinRequest: request,
                };

                const res: NestResponse = {
                    joinResponse: response,
                };

                const canProceed = await resolveGuards(moduleRef, req, target, propertyKey);

                if (canProceed) {
                    const data = await originalMethod.apply(
                        instance,
                        resolveParameters(req, res, target, propertyKey),
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

export function OnLeaveEvent () {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        const { set } = manageOnLeaveHandlers(target);

        set('', async (instance, _, event) => {
            try {
                await originalMethod.apply(
                    instance,
                    resolveParameters({
                        leveeEvent: event,
                    }, {}, target, propertyKey),
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

        set(event, async (instance, moduleRef, request, response) => {
            try {
                const req: NestRequest = {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    eventRequest: request,
                };

                const res: NestResponse = {
                    eventResponse: response,
                };

                const canProceed = await resolveGuards(moduleRef, req, target, propertyKey);

                if (canProceed) {
                    const data = await originalMethod.apply(
                        instance,
                        resolveParameters(req, res, target, propertyKey),
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

const setChannels = (channels: Constructor<NonNullable<unknown>>[]) => createClassDecorator(channelsClassKey, channels);

const getChannels = (target: any) => getClassMetadata<Constructor<NonNullable<unknown>>[]>(
    channelsClassKey,
    target,
) ?? [];

export const Endpoint = (metadata: EndpointMetadata) => applyDecorators(setChannels(metadata.channels), setEndpoint(metadata.path));

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
                    await handler.value(instance, this.moduleRef, request, response);
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
        const channels = endpoints.flatMap((endpoint) => getChannels(endpoint));

        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            useFactory: (moduleRef: ModuleRef, adapterHost: HttpAdapterHost) => new PondSocketService(
                moduleRef,
                adapterHost,
                endpoints,
            ),
            inject: [ModuleRef, HttpAdapterHost],
        };

        return {
            module: PondSocketModule,
            imports: [...imports, ...endpoints, ...channels],
            providers: [...providers, ...endpoints, ...channels, pondSocketProvider],
            exports: [...exports, ...channels],
            global: isGlobal,
        };
    }
}

