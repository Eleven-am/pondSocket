import type {
    ConnectionResponse,
    EventRequest,
    EventResponse,
    IncomingConnection,
    JoinRequest,
    JoinResponse,
} from '@eleven-am/pondsocket/types';

export function isEventRequest (request: IncomingConnection<string> | JoinRequest<string> | EventRequest<string>): request is EventRequest<string> {
    return 'channel' in request && !('joinParams' in request);
}

export function isJoinRequest (request: IncomingConnection<string> | JoinRequest<string> | EventRequest<string>): request is JoinRequest<string> {
    return 'joinParams' in request;
}

export function isConnectionRequest (request: IncomingConnection<string> | JoinRequest<string> | EventRequest<string>): request is IncomingConnection<string> {
    return 'headers' in request;
}

export function isEventResponse (response: ConnectionResponse | JoinResponse | EventResponse): response is EventResponse {
    return !('accept' in response);
}

export function isJoinResponse (response: ConnectionResponse | JoinResponse | EventResponse): response is JoinResponse {
    return 'accept' in response && 'broadcast' in response;
}

export function isConnectionResponse (response: ConnectionResponse | JoinResponse | EventResponse): response is ConnectionResponse {
    return 'accept' in response && !('broadcast' in response);
}
