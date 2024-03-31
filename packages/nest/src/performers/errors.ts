import type { ConnectionResponse, EventResponse, JoinResponse } from '@eleven-am/pondsocket/types';
// eslint-disable-next-line import/no-unresolved
import { HttpException } from '@nestjs/common';

import { isEventResponse } from './narrow';

export function performErrors (error: unknown, response: ConnectionResponse | JoinResponse | EventResponse) {
    let message: string;
    let status: number;

    if (error instanceof HttpException) {
        message = error.message;
        status = error.getStatus();
    } else if (error instanceof Error) {
        message = error.message;
        status = 500;
    } else {
        message = 'An unknown error occurred';
        status = 500;
    }

    if (isEventResponse(response)) {
        return response.reply('UNKNOWN_ERROR', {
            message,
            status,
        });
    }

    if (!response.hasResponded) {
        return response.decline(message, status);
    }

    throw error;
}
