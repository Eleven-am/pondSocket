import { PresenceEngine } from './presence';
import { ChannelEngine } from '../channel/channel';
import { createChannelEngine } from '../channel/eventResponse.test';
import { PresenceEventTypes, SystemSender, ChannelReceiver, ServerActions } from '../enums';
// eslint-disable-next-line import/no-unresolved
import { PondPresence } from '../types';

describe('PresenceEngine', () => {
    let presenceEngine: PresenceEngine;
    let presence: PondPresence;
    let presenceKey: string;
    let channel: ChannelEngine;

    beforeEach(() => {
        channel = createChannelEngine();
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
            jest.spyOn(channel, 'sendMessage');
            presenceEngine.trackPresence(presenceKey, presence);
            expect(channel.sendMessage).toHaveBeenCalledWith(
                SystemSender.CHANNEL,
                ChannelReceiver.ALL_USERS,
                ServerActions.PRESENCE,
                PresenceEventTypes.JOIN,
                {
                    changed: presence,
                    presence: [presence],
                },
            );
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

            jest.spyOn(channel, 'sendMessage');
            presenceEngine.updatePresence(presenceKey, newPresence);
            expect(channel.sendMessage).toHaveBeenCalledWith(
                SystemSender.CHANNEL,
                ChannelReceiver.ALL_USERS,
                ServerActions.PRESENCE,
                PresenceEventTypes.UPDATE,
                {
                    changed: {
                        ...presence,
                        ...newPresence,
                    },
                    presence: [newPresence],
                },
            );
        });

        it('should throw an error if the presence does not exist', () => {
            expect(() => presenceEngine.updatePresence(presenceKey, presence)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        });
    });

    describe('removePresence', () => {
        it('should remove a presence from the presence engine', () => {
            const listener = jest.spyOn(channel, 'sendMessage');

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
            expect(listener).toHaveBeenCalledWith(
                SystemSender.CHANNEL,
                ChannelReceiver.ALL_USERS,
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
            );

            listener.mockClear();
            presenceEngine.removePresence('presenceKey2');
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(
                SystemSender.CHANNEL,
                ChannelReceiver.ALL_USERS,
                ServerActions.PRESENCE,
                PresenceEventTypes.LEAVE,
                {
                    changed: {
                        ...presence,
                        key: 'presence2',
                    },
                    presence: [],
                },
            );
        });

        it('should throw an error if the presence does not exist', () => {
            expect(() => presenceEngine.removePresence(presenceKey)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
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
