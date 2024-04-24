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
import type { ModuleMetadata } from '@nestjs/common';
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
    callback: (context: Context) => unknown | Promise<unknown>;
}

export type HandlerData<Req, Res> = {
    path: string;
    value: (instance: unknown, moduleRef: ModuleRef, request: Req, response: Res) => Promise<void>;
}

export type Constructor<T> = new (...args: any[]) => T;

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
    isGlobal?: boolean;
}

export type PondResponse<Event extends string = string, Payload extends PondMessage = PondMessage, Presence extends PondPresence = PondPresence, Assigns extends PondAssigns = PondAssigns> = {
    event?: Event;
    broadcast?: Event;
    presence?: Presence;
    broadcastFrom?: Event;
    subscribeTo?: string[];
    unsubscribeFrom?: string[];
    assigns?: Partial<Assigns>;
} & Payload;
