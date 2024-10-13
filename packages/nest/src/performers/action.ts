import type {
    ConnectionResponse,
    EventRequest,
    EventResponse,
    IncomingConnection,
    JoinRequest,
    JoinResponse,
    LeaveEvent,
} from '@eleven-am/pondsocket/types';
import type { PipeTransform } from '@nestjs/common';
import type { ModuleRef } from '@nestjs/core';

import { Context } from '../context/context';
import { retrieveInstance } from '../helpers/misc';
import { manageGuards } from '../managers/guards';
import { manageParameters } from '../managers/parametres';
import { NestRequest, NestResponse, PondResponse, Constructor, CanActivate } from '../types';
import {
    isConnectionRequest,
    isConnectionResponse,
    isEventRequest,
    isEventResponse,
    isJoinRequest,
    isJoinResponse,
} from './narrow';
import { performResponse } from './response';

async function retrieveParameters (context: Context, globalPipes: Constructor<PipeTransform>[], moduleRef: ModuleRef) {
    const gottenValues = manageParameters(context.getInstance(), context.getMethod()).get() ?? [];

    const promises = gottenValues
        .map(async ({ callback, index }) => ({
            value: await callback(context, globalPipes, moduleRef),
            index,
        }));

    const values = await Promise.all(promises);

    return values
        .sort((a, b) => a.index - b.index)
        .map(({ value }) => value);
}

async function performGuards (moduleRef: ModuleRef, globalGuards: Constructor<CanActivate>[], context: Context) {
    const classGuards = manageGuards(context.getClass()).get();
    const methodGuards = manageGuards(context.getInstance(), context.getMethod()).get();

    const guards = globalGuards
        .concat(classGuards, methodGuards)
        .map((Guard) => retrieveInstance(moduleRef, Guard));

    const promises = guards.map((guard) => guard.canActivate(context));
    const results = await Promise.all(promises);

    return results.every((result) => result);
}

export async function performAction (
    instance: any,
    moduleRef: ModuleRef,
    globalGuards: Constructor<CanActivate>[],
    globalPipes: Constructor<PipeTransform>[],
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

    const canProceed = await performGuards(moduleRef, globalGuards, context);

    if (canProceed) {
        const data = await originalMethod.apply(
            instance,
            await retrieveParameters(context, globalPipes, moduleRef),
        );

        performResponse(socketId, channel, data, response);
    } else if (response && (isJoinResponse(response) || isConnectionResponse(response))) {
        response.decline('Unauthorized', 403);
    }
}
