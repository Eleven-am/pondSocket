import type {
    ConnectionResponse,
    EventRequest,
    EventResponse,
    IncomingConnection,
    JoinRequest,
    JoinResponse,
    LeaveEvent,
    PondAssigns,
    PondMessage,
    PondPresence,
} from '@eleven-am/pondsocket/types';
import type { DiscoveredClass } from '@golevelup/nestjs-discovery/lib/discovery.interfaces';
import type { ModuleMetadata, PipeTransform } from '@nestjs/common';
import type { ModuleRef } from '@nestjs/core';

import type { Context } from './context/context';

export interface NestRequest {
    connection?: IncomingConnection<string>;
    joinRequest?: JoinRequest<string>;
    eventRequest?: EventRequest<string>;
    leveeEvent?: LeaveEvent;
}

export interface NestResponse {
    connection?: ConnectionResponse;
    joinResponse?: JoinResponse;
    eventResponse?: EventResponse;
}

export type ParamDecoratorCallback<Input> = (data: Input, context: Context, type: unknown) => unknown | Promise<unknown>;

export interface ParamDecoratorMetadata {
    index: number;
    callback: (context: Context, globalPipes: Constructor<PipeTransform>[], moduleRef: ModuleRef) => Promise<unknown>;
}

export type HandlerFunction<Req, Res> = (instance: unknown, moduleRef: ModuleRef, globalGuards: Constructor<CanActivate>[], globalPipes: Constructor<PipeTransform>[], request: Req, response: Res) => Promise<void>;

export type HandlerData<Req, Res> = {
    path: string;
    value: HandlerFunction<Req, Res>;
}

export type Constructor<T, Parameters extends any[] = any[]> = new (...args: Parameters) => T;

export interface CanActivate {

    /**
     * @desc Whether the client can continue with the request
     * @param context - The context of the request
     */
    canActivate(context: Context): boolean | Promise<boolean>;
}

export type GroupedInstances = {
    endpoint: DiscoveredClass;
    channels: DiscoveredClass[];
}

export interface Metadata extends Omit<ModuleMetadata, 'controllers'> {
    guards?: Constructor<CanActivate>[];
    pipes?: Constructor<PipeTransform>[];
    isExclusiveSocketServer?: boolean;
    isGlobal?: boolean;
}

export type PondResponse<Event extends string = string, Payload extends PondMessage = PondMessage, Presence extends PondPresence = PondPresence, Assigns extends PondAssigns = PondAssigns> = {
    event?: Event;
    broadcast?: Event;
    broadcastFrom?: Event;
    assigns?: Partial<Assigns>;
    presence?: Partial<Presence>;
    broadcastTo?: {
        event: Event;
        users: string[];
    };
} & Payload;
