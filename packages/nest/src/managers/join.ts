import type { JoinRequest, JoinResponse } from '@eleven-am/pondsocket/types';

import { manageHandlers } from './handlers';
import { onJoinHandlerKey } from '../constants';

export function manageJoin (target: unknown) {
    return manageHandlers<JoinRequest<string>, JoinResponse>(
        onJoinHandlerKey,
        target,
    );
}
