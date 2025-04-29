import { PondEvent, PondPresence, PondAssigns, ServerActions } from '@eleven-am/pondsocket-common';

import { BroadcastEvent } from '../abstracts/types';
import { EventRequest } from '../requests/eventRequest';
import { Channel } from '../wrappers/channel';
import { MockChannelEngine } from './mocks/channelEnegine';

describe('EventRequest', () => {
    let mockChannelEngine: MockChannelEngine;
    let eventRequest: EventRequest<string>;
    const mockEvent: BroadcastEvent = {
        event: 'test-event',
        sender: 'user1',
        channelName: 'test-channel',
        requestId: 'request-123',
        action: ServerActions.BROADCAST,
        payload: { message: 'Hello, world!' },
    };
    const mockParams = {
        params: { id: '123' },
        query: { sort: 'asc' },
    };

    beforeEach(() => {
        mockChannelEngine = new MockChannelEngine();
        mockChannelEngine.name = 'test-channel';
        eventRequest = new EventRequest(mockEvent, mockParams, mockChannelEngine);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('event', () => {
        it('should return the correct PondEvent object', () => {
            const expectedEvent: PondEvent<string> = {
                event: 'test-event',
                params: { id: '123' },
                query: { sort: 'asc' },
                payload: { message: 'Hello, world!' },
            };

            expect(eventRequest.event).toEqual(expectedEvent);
        });
    });

    describe('channelName', () => {
        it('should return the correct channel name', () => {
            expect(eventRequest.channelName).toBe('test-channel');
        });
    });

    describe('channel', () => {
        it('should return a Channel instance', () => {
            const channel = eventRequest.channel;

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

            expect(eventRequest.presences).toEqual(mockPresences);
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

            expect(eventRequest.assigns).toEqual(mockAssigns);
            expect(mockChannelEngine.getAssigns).toHaveBeenCalled();
        });
    });

    describe('user', () => {
        it('should return the user data from the channel engine', () => {
            const mockUserData = {
                id: 'user1',
                assigns: { role: 'admin' } as PondAssigns,
                presence: { status: 'online' } as PondPresence,
            };

            // Use getUserData instead of getUser to match the implementation
            mockChannelEngine.getUserData.mockReturnValue(mockUserData);

            expect(eventRequest.user).toEqual(mockUserData);
            expect(mockChannelEngine.getUserData).toHaveBeenCalledWith('user1');
        });
    });
});
