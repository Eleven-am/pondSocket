import { HandlerData, HandlerFunction } from '../types';
import { manageClass } from './class';

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
            value: HandlerFunction<Request, Response>,
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
