import type {
    ConnectionResponse,
    EventRequest,
    EventResponse,
    IncomingConnection,
    JoinRequest,
    JoinResponse,
    LeaveEvent,
} from '@eleven-am/pondsocket/types';
import type { ModuleRef } from '@nestjs/core';

import { performGuards } from './guards';
import {
    isConnectionRequest,
    isConnectionResponse,
    isEventRequest,
    isEventResponse,
    isJoinRequest,
    isJoinResponse,
} from './narrow';
import { performResponse } from './response';
import { Context } from '../context/context';
import { manageParameters } from '../managers/parametres';
import { NestRequest, NestResponse, PondResponse } from '../types';

async function retrieveParameters (context: Context) {
    const gottenValues = manageParameters(context.getInstance(), context.getMethod()).get() ?? [];

    const promises = gottenValues
        .map(async ({ callback, index }) => ({
            value: await callback(context),
            index,
        }));

    const values = await Promise.all(promises);

    return values
        .sort((a, b) => a.index - b.index)
        .map(({ value }) => value);
}

export async function performAction (
    instance: any,
    moduleRef: ModuleRef,
    originalMethod: (...args: any[]) => Promise<PondResponse | null | undefined>,
    propertyKey: string,
    leaveEvent: LeaveEvent | null,
    request?: IncomingConnection<string> | JoinRequest<string> | EventRequest<string>,
    response?: ConnectionResponse | JoinResponse | EventResponse,
) {
    const req: NestRequest = {};
    const res: NestResponse = {};

    if (request && response) {
        if (isJoinRequest(request) && isJoinResponse(response)) {
            req.joinRequest = request;
            res.joinResponse = response;
        } else if (isEventRequest(request) && isEventResponse(response)) {
            req.eventRequest = request;
            res.eventResponse = response;
        } else if (isConnectionRequest(request) && isConnectionResponse(response)) {
            req.connection = request;
            res.connection = response;
        }
    } else if (leaveEvent) {
        req.leveeEvent = leaveEvent;
    }

    const context = new Context(req, res, instance, propertyKey);
    const channel = context.channel;
    const socketId = context.user.id;

    const canProceed = await performGuards(moduleRef, context);

    if (canProceed) {
        const data = await originalMethod.apply(
            instance,
            await retrieveParameters(context),
        );

        performResponse(socketId, channel, data, response);
    } else if (response && (isJoinResponse(response) || isConnectionResponse(response))) {
        response.decline('Unauthorized', 403);
    }
}
