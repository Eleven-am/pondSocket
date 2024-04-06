import { PondPresence, PresenceEventTypes, ServerActions } from '@eleven-am/pondsocket-common';

import { PresenceEngine } from './presence';
import { ChannelEngine } from '../channel/channel';
import { createChannelEngine } from '../channel/eventResponse.test';

describe('PresenceEngine', () => {
    let presenceEngine: PresenceEngine;
    let presence: PondPresence;
    let presenceKey: string;
    let channel: ChannelEngine;

    beforeEach(() => {
        channel = createChannelEngine().channelEngine;
        channel.addUser('presenceKey', { assign: 'assign' }, () => {
            // do nothing
        });
        presenceEngine = new PresenceEngine(channel);
        presence = {
            id: 'id',
            name: 'name',
            color: 'color',
            type: 'type',
            location: 'location',
        };
        presenceKey = 'presenceKey';
    });

    describe('trackPresence', () => {
        it('should insert a presence into the presence engine', () => {
            // spy on the channel sendMessage method
            const sendMessage = jest.spyOn(channel, 'sendMessage');

            presenceEngine.trackPresence(presenceKey, presence);

            // get all the params
            const params = sendMessage.mock.calls[0];
            // remove the first element as it contains the request id which is random

            params.shift();
            expect(params).toEqual([
                ['presenceKey'],
                ServerActions.PRESENCE,
                PresenceEventTypes.JOIN,
                {
                    changed: presence,
                    presence: [presence],
                },
            ]);
        });

        it('should throw an error if the presence already exists', () => {
            presenceEngine.trackPresence(presenceKey, presence);
            expect(() => presenceEngine.trackPresence(presenceKey, presence)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} already exists`);
        });
    });

    describe('updatePresence', () => {
        it('should update a presence', () => {
            presenceEngine.trackPresence(presenceKey, presence);
            const newPresence = {
                id: 'id',
                name: 'name',
                color: 'color',
                type: 'type',
                location: 'location',
            };

            const sendMessage = jest.spyOn(channel, 'sendMessage');

            presenceEngine.updatePresence(presenceKey, newPresence);

            // get all the params
            const params = sendMessage.mock.calls[0];
            // remove the first element as it contains the request id which is random

            params.shift();

            expect(params).toEqual([
                ['presenceKey'],
                ServerActions.PRESENCE,
                PresenceEventTypes.UPDATE,
                {
                    changed: {
                        ...presence,
                        ...newPresence,
                    },
                    presence: [newPresence],
                },
            ]);
        });

        it('should throw an error if the presence does not exist', () => {
            expect(() => presenceEngine.updatePresence(presenceKey, presence)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        });
    });

    describe('removePresence', () => {
        it('should remove a presence from the presence engine', () => {
            const listener = jest.spyOn(channel, 'sendMessage');

            // before we can track a presence, we need make sure the user is in the channel
            channel.addUser('presenceKey2', { assign: 'assign' }, () => {
                // do nothing
            });

            listener.mockClear();
            presenceEngine.trackPresence(presenceKey, presence);
            presenceEngine.trackPresence('presenceKey2', {
                ...presence,
                key: 'presence2',
            });

            expect(listener).toHaveBeenCalledTimes(2);

            // clear the mock
            listener.mockClear();

            presenceEngine.removePresence(presenceKey);

            expect(listener).toHaveBeenCalledTimes(1);

            // get all the params
            const params = listener.mock.calls[0];
            // remove the first element as it contains the request id which is random

            params.shift();

            expect(params).toEqual([
                ['presenceKey2'],
                ServerActions.PRESENCE,
                PresenceEventTypes.LEAVE,
                {
                    changed: presence,
                    presence: [
                        {
                            ...presence,
                            key: 'presence2',
                        },
                    ],
                },
            ]);

            listener.mockClear();
            presenceEngine.removePresence('presenceKey2');
            expect(listener).toHaveBeenCalledTimes(0);
        });

        it('should throw an error if the presence does not exist', () => {
            expect(() => presenceEngine.removePresence(presenceKey)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        });

        it('should not throw an error if the safe flag is true', () => {
            expect(() => presenceEngine.removePresence(presenceKey, true)).not.toThrow();
        });
    });

    describe('getPresence', () => {
        it('should return the presence', () => {
            presenceEngine.trackPresence(presenceKey, presence);
            const data: any = {};

            data[presenceKey] = presence;
            expect(presenceEngine.getPresence()).toEqual(data);
        });
    });
});
