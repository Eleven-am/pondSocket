import { IncomingHttpHeaders, Server as HTTPServer } from 'http';
import { IncomingMessage } from 'node:http';
import internal from 'node:stream';

import {
    PondAssigns,
    ChannelEvent,
    JoinParams,
    EventParams,
    PondMessage,
    ServerActions,
    SystemSender,
    UserData,
    Unsubscribe,
} from '@eleven-am/pondsocket-common';
import { WebSocketServer, WebSocket } from 'ws';

import { ConnectionContext } from '../contexts/connectionContext';
import { EventContext } from '../contexts/eventContext';
import { JoinContext } from '../contexts/joinContext';
import { EndpointEngine } from '../engines/endpointEngine';
import { HttpError } from '../errors/httpError';
import { Channel } from '../wrappers/channel';

export type NextFunction<Error extends HttpError = HttpError> = (error?: Error) => void;

export type MiddlewareFunction<Request, Response> = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export interface SocketRequest {
    id: string;
    headers: IncomingHttpHeaders;
    address: string;
}

export interface PondSocketOptions {
    server?: HTTPServer;
    socketServer?: WebSocketServer;
    exclusiveServer?: boolean;
}

export interface OutgoingEvent<Event extends string> {
    event: EventParams<Event>;
    payload: PondMessage;
    userData: UserData;
    channel: Channel;
}

export type ConnectionHandler<Path extends string> = (ctx: ConnectionContext<Path>, next: NextFunction) => void | Promise<void>;

export type AuthorizationHandler<Path extends string> = (ctx: JoinContext<Path>, next: NextFunction) => void | Promise<void>;

export type EventHandler<Path extends string> = (ctx: EventContext<Path>, next: NextFunction) => void | Promise<void>;

export type OutgoingEventHandler<Event extends string> = (event: OutgoingEvent<Event>) => PondMessage | Promise<PondMessage> | void | Promise<void>;

export type InternalOutgoingEventHandler = (event: ChannelEvent, channel: Channel, userId: string) => Promise<PondMessage | boolean>;

export interface ConnectionParams {
    head: Buffer;
    socket: internal.Duplex;
    request: IncomingMessage;
    requestId: string;
}

export interface SocketCache {
    clientId: string;
    socket: WebSocket;
    assigns: PondAssigns;
    subscriptions: Set<Unsubscribe>;
}

export interface ConnectionResponseOptions {
    engine: EndpointEngine;
    params: ConnectionParams;
    webSocketServer: WebSocketServer;
}

export interface JoinRequestOptions<Path extends string> {
    clientId: string;
    assigns: PondAssigns;
    joinParams: JoinParams;
    params: EventParams<Path>;
}

export interface RequestCache extends SocketCache {
    channelName: string;
    requestId: string;
}

export type InternalChannelEvent = ChannelEvent & {
    recipients: string[];
}

export type ChannelSenders = SystemSender.CHANNEL | string;

export type BroadcastEvent = Omit<InternalChannelEvent, 'action' | 'payload' | 'recipients'> & {
    action: ServerActions.BROADCAST;
    sender: ChannelSenders;
    payload: PondMessage;
}

export interface LeaveEvent {
    user: UserData;
    channel: Channel;
}

export type LeaveCallback = (event: LeaveEvent) => void;


