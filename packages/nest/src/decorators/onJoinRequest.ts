import { manageJoin } from '../managers/join';
import { performAction } from '../performers/action';
import { performErrors } from '../performers/errors';
import { PondResponse } from '../types';

export function OnJoinRequest (): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value as (...args: any[]) => Promise<PondResponse | null | undefined>;
        const { set } = manageJoin(target);

        set('', async (instance, moduleRef, globalGuards, globalPipes, request, response) => {
            try {
                await performAction(
                    instance,
                    moduleRef,
                    globalGuards,
                    globalPipes,
                    originalMethod,
                    propertyKey as string,
                    null,
                    request,
                    response,
                );
            } catch (error) {
                performErrors(error, response);
            }
        });
    };
}
