import type { Channel, ConnectionResponse, EventResponse, JoinResponse } from '@eleven-am/pondsocket/types';

import { isConnectionResponse, isEventResponse, isJoinResponse } from './narrow';
import { PondResponse } from '../types';

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
        subscribeTo,
        unsubscribeFrom,
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
                if (broadcast || broadcastFrom) {
                    const event = broadcastFrom || broadcast || '';

                    response.broadcast(event, rest);
                }

                if (broadcastTo) {
                    response.broadcastTo(broadcastTo.event, rest, broadcastTo.users);
                }
            }
        }

        if (subscribeTo) {
            subscribeTo.forEach((channelName) => {
                response.subscribeTo(channelName);
            });
        }

        if (unsubscribeFrom) {
            unsubscribeFrom.forEach((channelName) => {
                response.unsubscribeFrom(channelName);
            });
        }
    }

    if (channel) {
        if (isNotEmpty(rest) && broadcast && !response) {
            channel.broadcast(broadcast, rest);
        }

        if (isNotEmpty(presence)) {
            channel.upsertPresence(socketId, presence);
        }
    }
}
