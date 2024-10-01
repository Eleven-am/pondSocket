import type { Channel, ConnectionResponse, EventResponse, JoinResponse } from '@eleven-am/pondsocket/types';

import { PondResponse } from '../types';
import { isConnectionResponse, isEventResponse, isJoinResponse } from './narrow';

function isNotEmpty<TValue> (value: TValue | null | undefined): value is TValue {
    return value !== null &&
        value !== undefined &&
        value !== '' &&
        Object.keys(value).length !== 0;
}

export function performResponse (
    socketId: string,
    channel: Channel | null,
    data: PondResponse | null | undefined,
    response?: ConnectionResponse | JoinResponse | EventResponse,
) {
    if (response && response.hasResponded || !isNotEmpty(data)) {
        return;
    }

    const {
        event,
        presence,
        assigns,
        broadcast,
        broadcastFrom,
        broadcastTo,
        ...rest
    } = data;

    if (response) {
        if (isConnectionResponse(response) || isJoinResponse(response)) {
            response
                .assign(typeof assigns === 'object' ? assigns : {})
                .accept();
        } else {
            response
                .assign(typeof assigns === 'object' ? assigns : {});
        }

        if (isNotEmpty(rest)) {
            if (event) {
                response.reply(event, rest);
            }

            if (isJoinResponse(response) || isEventResponse(response)) {
                if (broadcast) {
                    response.broadcast(broadcast, rest);
                }

                if (broadcastFrom) {
                    response.broadcastFrom(broadcastFrom, rest);
                }

                if (broadcastTo) {
                    response.broadcastTo(broadcastTo.event, rest, broadcastTo.users);
                }
            }
        }
    }

    if (channel) {
        if (isNotEmpty(rest) && !response) {
            if (broadcast || event) {
                const newEvent = (broadcast || event) as string;

                channel.broadcast(newEvent, rest);
            }

            if (broadcastTo) {
                channel.broadcastTo(broadcastTo.users, broadcastTo.event, rest);
            }
        }

        if (isNotEmpty(presence)) {
            channel.upsertPresence(socketId, presence);
        }
    }
}
