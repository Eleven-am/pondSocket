import { PondEvent, JoinParams } from '@eleven-am/pondsocket-common';

import { JoinRequestOptions } from '../abstracts/types';
import { JoinRequest } from '../requests/joinRequest';
import { Channel } from '../wrappers/channel';
import { MockChannelEngine } from './mocks/channelEnegine';


describe('JoinRequest', () => {
    let mockChannelEngine: MockChannelEngine;
    let joinRequest: JoinRequest<string>;
    const mockOptions: JoinRequestOptions<string> = {
        clientId: 'user1',
        assigns: { role: 'user' },
        joinParams: { token: 'abc123' } as JoinParams,
        params: {
            params: { id: '123' },
            query: { sort: 'asc' },
        },
    };

    beforeEach(() => {
        mockChannelEngine = new MockChannelEngine();
        mockChannelEngine.name = 'test-channel';
        joinRequest = new JoinRequest(mockOptions, mockChannelEngine);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('event', () => {
        it('should return the correct PondEvent object', () => {
            const expectedEvent: PondEvent<string> = {
                event: 'test-channel',
                params: { id: '123' },
                query: { sort: 'asc' },
                payload: { token: 'abc123' },
            };

            expect(joinRequest.event).toEqual(expectedEvent);
        });
    });

    describe('channelName', () => {
        it('should return the correct channel name', () => {
            expect(joinRequest.channelName).toBe('test-channel');
        });
    });

    describe('channel', () => {
        it('should return a Channel instance', () => {
            const channel = joinRequest.channel;

            expect(channel).toBeInstanceOf(Channel);
        });
    });

    describe('presences', () => {
        it('should return the presences from the channel engine', () => {
            const mockPresences = {
                user1: { status: 'online' },
                user2: { status: 'away' },
            };

            mockChannelEngine.getPresence.mockReturnValue(mockPresences);

            expect(joinRequest.presences).toEqual(mockPresences);
            expect(mockChannelEngine.getPresence).toHaveBeenCalled();
        });
    });

    describe('assigns', () => {
        it('should return the assigns from the channel engine', () => {
            const mockAssigns = {
                user1: { role: 'admin' },
                user2: { role: 'user' },
            };

            mockChannelEngine.getAssigns.mockReturnValue(mockAssigns);

            expect(joinRequest.assigns).toEqual(mockAssigns);
            expect(mockChannelEngine.getAssigns).toHaveBeenCalled();
        });
    });

    describe('user', () => {
        it('should return the user data from the join options', () => {
            const expectedUserData = {
                id: 'user1',
                assigns: { role: 'user' },
                presence: {},
            };

            expect(joinRequest.user).toEqual(expectedUserData);
        });
    });
});
