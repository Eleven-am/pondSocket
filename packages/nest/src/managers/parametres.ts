import 'reflect-metadata';
import { manageMethod } from './method';
import { parametersKey } from '../constants';
import { Context } from '../context/context';
import { ParamDecoratorMetadata } from '../types';

export function manageParameters (target: any, propertyKey: string) {
    const { get, set } = manageMethod<ParamDecoratorMetadata[]>(
        parametersKey,
        target,
        propertyKey,
    );

    return {
        get () {
            return get() || [];
        },
        set (index: number, callback: (context: Context) => unknown | Promise<unknown>) {
            const handlers = get() || [];

            set([
                ...handlers,
                {
                    index,
                    callback,
                },
            ]);
        },
    };
}
