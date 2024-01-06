import { IncomingHttpHeaders } from 'http';

import { PresenceEventTypes, ChannelReceiver } from './enums';

export type Unsubscribe = () => void;

type IsParam<Path> = Path extends `:${infer Param}` ? Param : never;

type FilteredParams<Path> = Path extends `${infer First}/${infer Second}`
    ? IsParam<First> | FilteredParams<Second>
    : IsParam<Path>

export type Params<Path> = {
    [Key in FilteredParams<Path>]: string
}

export type PondPath<Path extends string> = Path | RegExp;

export type EventParams<Path> = {
    query: Record<string, string>;
    params: Params<Path>;
}

type Primitives = number | string | boolean | null | undefined;

type PondObject = {
    [key: string]: Primitives | PondObject | PondObject[];
}

export type PondPresence = PondObject;
export type PondMessage = PondObject;
export type PondAssigns = PondObject;
export type JoinParams = PondObject;

export interface PresencePayload extends PondObject {
    changed: PondPresence;
    presence: PondPresence[];
}

export interface UserPresences {
    [userId: string]: PondPresence;
}

export interface UserAssigns {
    [userId: string]: PondAssigns;
}

export type ChannelReceivers = ChannelReceiver | string[];

export interface Event {
    action: 'SYSTEM' | 'BROADCAST' | 'ERROR';
    event: string;
    payload: PondMessage;
    channelName: string;
    requestId: string;
}

interface PresenceEventMessage {
    action: 'PRESENCE';
    event: PresenceEventTypes;
    channelName: string;
    payload: PresencePayload;
    requestId: string;
}

export type ChannelEvent = Event | PresenceEventMessage;

export type PondEvent<Path> = EventParams<Path> & {
    payload: PondMessage;
    event: string;
}

export type IncomingConnection<Path> = EventParams<Path> & {
    id: string;
    headers: IncomingHttpHeaders;
    address: string;
}

export interface UserData {
    assigns: PondAssigns;
    presence: PondPresence;
    id: string;
}
