import type { EventRequest, EventResponse } from '@eleven-am/pondsocket/types';

import { manageHandlers } from './handlers';
import { onEventHandlerKey } from '../constants';

export function manageEvent (target: unknown) {
    return manageHandlers<EventRequest<string>, EventResponse>(
        onEventHandlerKey,
        target,
    );
}
