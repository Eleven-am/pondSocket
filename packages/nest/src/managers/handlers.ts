import type { ModuleRef } from '@nestjs/core';

import { manageClass } from './class';
import { HandlerData } from '../types';

export function manageHandlers<Request, Response> (key: symbol, target: any) {
    const { get, set } = manageClass<HandlerData<Request, Response>[]>(
        key,
        target,
    );

    return {
        get () {
            return get() || [];
        },
        set (
            path: string,
            value: (
                instance: unknown,
                moduleRef: ModuleRef,
                request: Request,
                response: Response,
            ) => Promise<void>,
        ) {
            const handlers = get() || [];

            set([
                ...handlers,
                {
                    path,
                    value,
                },
            ]);
        },
    };
}
