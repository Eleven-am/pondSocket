import type { ConnectionResponse, IncomingConnection } from '@eleven-am/pondsocket/types';

import { onConnectionHandlerKey } from '../constants';
import { manageHandlers } from './handlers';


export function manageConnection (target: unknown) {
    return manageHandlers<IncomingConnection<string>, ConnectionResponse>(
        onConnectionHandlerKey,
        target,
    );
}
