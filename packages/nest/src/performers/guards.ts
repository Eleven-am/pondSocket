import type { ModuleRef } from '@nestjs/core';

import { Context } from '../context/context';
import { manageGuards } from '../managers/guards';
import { CanActivate, Constructor } from '../types';

function retrieveGuard (moduleRef: ModuleRef, Guard: Constructor<CanActivate>): CanActivate {
    try {
        return moduleRef.get(Guard, { strict: false });
    } catch (e) {
        console.warn(`Unable to resolve guard: ${Guard.name}, creating new instance, WARNING: this will not inject dependencies. To fix this, add the guard to the providers array of the PondSocketModule.`);

        return new Guard();
    }
}

export async function performGuards (moduleRef: ModuleRef, context: Context) {
    const classGuards = manageGuards(context.getClass()).get();
    const methodGuards = manageGuards(context.getInstance(), context.getMethod()).get();

    const guards = ([] as Constructor<CanActivate>[])
        .concat(classGuards, methodGuards)
        .map((Guard) => retrieveGuard(moduleRef, Guard));

    const promises = guards.map((guard) => guard.canActivate(context));
    const results = await Promise.all(promises);

    return results.every((result) => result);
}
