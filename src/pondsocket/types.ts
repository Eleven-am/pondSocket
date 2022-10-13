import { default_t, ResponsePicker } from "../pondbase";
import { ClientActions, ServerActions } from "./enums";
import { WebSocket } from "ws";
import { IncomingHttpHeaders } from "http";

export interface NewUser {
  client: Omit<SocketCache, 'assigns' | 'socket'>;
  assigns: PondAssigns;
  presence: PondPresence;
  channelData: PondChannelData;
}

export type PondAssigns = default_t;
export type PondPresence = default_t;
export type PondChannelData = default_t;
export type PondMessage = default_t;

export type ServerMessage = {
  action: ServerActions;
  channelName: string;
  payload: default_t;
  event: string;
}

export interface SocketCache {
  clientId: string
  socket: WebSocket;
  assigns: PondAssigns;
}

export interface IncomingConnection {
  clientId: string;
  params: default_t<string>;
  query: default_t<string>;
  headers: IncomingHttpHeaders;
  address: string;
}

export interface IncomingJoinMessage {
  clientId: string;
  channelName: string;
  clientAssigns: PondAssigns;
  joinParams: default_t;
  params: default_t<string>;
  query: default_t<string>;
}

export interface IncomingChannelMessage {
  channelName: string;
  event: string;
  message: default_t;
  client: {
    clientId: string;
    clientAssigns: PondAssigns;
    clientPresence: PondPresence;
  },
  params: default_t<string>;
  query: default_t<string>;
}

export interface PondResponseAssigns {
  assigns?: PondAssigns;
  presence?: PondPresence;
  channelData?: PondChannelData;
}

export type ClientMessage = {
  action: ClientActions;
  channelName: string;
  event: string;
  payload: default_t;
  addresses?: string[];
}

export type SendResponse<T = ResponsePicker.CHANNEL> = T extends ResponsePicker.CHANNEL ? Required<PondResponseAssigns> :
  T extends ResponsePicker.POND ? Required<Omit<PondResponseAssigns, 'presence' | 'channelData'>> : never;

export interface ResponseResolver<T = ResponsePicker.CHANNEL> {
  assigns: SendResponse<T>
  message?: { event: string, payload: PondMessage };
  error?: {
    errorMessage: string;
    errorCode: number;
  }
}
