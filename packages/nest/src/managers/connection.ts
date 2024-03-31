import type { ConnectionResponse, IncomingConnection } from '@eleven-am/pondsocket/types';

import { manageHandlers } from './handlers';
import { onConnectionHandlerKey } from '../constants';


export function manageConnection (target: unknown) {
    return manageHandlers<IncomingConnection<string>, ConnectionResponse>(
        onConnectionHandlerKey,
        target,
    );
}
