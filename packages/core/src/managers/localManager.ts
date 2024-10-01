import { PondAssigns, PondPresence } from '@eleven-am/pondsocket-common';

import { Manager, ActionTypes } from './manager';
import { InternalChannelEvent } from '../abstracts/types';


export class LocalManager extends Manager {
    constructor (channelId: string) {
        super(channelId);
    }

    trackPresence (userId: string, data: PondPresence) {
        const message = this.processPresenceData(ActionTypes.CREATE, userId, data);

        return this.broadcast(message);
    }

    updatePresence (userId: string, data: PondPresence) {
        const message = this.processPresenceData(ActionTypes.UPDATE, userId, data);

        return this.broadcast(message);
    }

    removePresence (userId: string) {
        const message = this.processPresenceData(ActionTypes.DELETE, userId, null);

        return this.broadcast(message);
    }

    setAssigns (userId: string, data: PondAssigns) {
        return this.processAssignsData(ActionTypes.CREATE, userId, data);
    }

    updateAssigns (userId: string, data: PondAssigns) {
        return this.processAssignsData(ActionTypes.UPDATE, userId, data);
    }

    removeAssigns (userId: string) {
        return this.processAssignsData(ActionTypes.DELETE, userId, null);
    }

    removeUser (userId: string) {
        const userData = super.removeUser(userId);

        this.userSubscriptions.get(userId)?.();
        this.userSubscriptions.delete(userId);

        return userData;
    }

    broadcast (message: InternalChannelEvent) {
        this.publisher.publish(message);
    }
}
