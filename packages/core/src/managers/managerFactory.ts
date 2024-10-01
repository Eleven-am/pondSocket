import { Unsubscribe } from '@eleven-am/pondsocket-common';

import { DistributedManager } from './distributedManager';
import { LocalManager } from './localManager';
import { Manager } from './manager';
import { ClientFactory } from '../abstracts/types';

export class ManagerFactory {
    static async create (channelId: string, clientFactory: ClientFactory | null, onClose: Unsubscribe): Promise<Manager> {
        let manager;

        if (clientFactory) {
            const client = clientFactory(channelId);

            manager = new DistributedManager(client);
        } else {
            manager = new LocalManager(channelId);
        }

        await manager.initialize(onClose);

        return manager;
    }
}
