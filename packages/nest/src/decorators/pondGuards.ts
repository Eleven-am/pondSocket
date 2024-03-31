import { manageGuards } from '../managers/guards';
import { CanActivate, Constructor } from '../types';

export function PondGuards (...guards: Constructor<CanActivate>[]): ClassDecorator | MethodDecorator {
    return (target, propertyKey) => {
        const { set } = manageGuards(target, propertyKey as string | undefined);

        set(guards);
    };
}
