import { ServerActions, PondPresence, PondAssigns, PondMessage } from '@eleven-am/pondsocket-common';

import { BroadcastEvent } from '../abstracts/types';
import { EventResponse } from '../responses/eventResponse';
import { MockChannelEngine } from './mocks/channelEnegine';

describe('EventResponse', () => {
    let mockChannelEngine: MockChannelEngine;
    let eventResponse: EventResponse;
    const mockEvent: BroadcastEvent = {
        sender: 'user1',
        event: 'test-event',
        action: ServerActions.BROADCAST,
        channelName: 'test-channel',
        requestId: 'request-123',
        payload: { message: 'Hello, world!' },
    };

    beforeEach(() => {
        mockChannelEngine = new MockChannelEngine();
        eventResponse = new EventResponse(mockEvent, mockChannelEngine);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('assign', () => {
        it('should call updateAssigns on the channel engine', () => {
            const assigns: PondAssigns = { role: 'admin' };

            eventResponse.assign(assigns);
            expect(mockChannelEngine.updateAssigns).toHaveBeenCalledWith('user1', assigns);
        });
    });

    describe('reply', () => {
        it('should call sendMessage on the channel engine with correct parameters', () => {
            const event = 'reply-event';
            const payload: PondMessage = { message: 'Reply message' };

            eventResponse.reply(event, payload);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith(
                'CHANNEL',
                ['user1'],
                ServerActions.SYSTEM,
                event,
                payload,
                'request-123',
            );
        });
    });

    describe('broadcast', () => {
        it('should call sendMessage on the channel engine with ALL_USERS', () => {
            const event = 'broadcast-event';
            const payload: PondMessage = { message: 'Broadcast message' };

            eventResponse.broadcast(event, payload);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith(
                'user1',
                'ALL_USERS',
                ServerActions.BROADCAST,
                event,
                payload,
                'request-123',
            );
        });
    });

    describe('broadcastFrom', () => {
        it('should call sendMessage on the channel engine with ALL_EXCEPT_SENDER', () => {
            const event = 'broadcast-from-event';
            const payload: PondMessage = { message: 'Broadcast from message' };

            eventResponse.broadcastFrom(event, payload);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith(
                'user1',
                'ALL_EXCEPT_SENDER',
                ServerActions.BROADCAST,
                event,
                payload,
                'request-123',
            );
        });
    });

    describe('broadcastTo', () => {
        it('should call sendMessage on the channel engine with specific user IDs', () => {
            const event = 'broadcast-to-event';
            const payload: PondMessage = { message: 'Broadcast to message' };
            const userIds = ['user2', 'user3'];

            eventResponse.broadcastTo(event, payload, userIds);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith(
                'user1',
                userIds,
                ServerActions.BROADCAST,
                event,
                payload,
                'request-123',
            );
        });
    });

    describe('trackPresence', () => {
        it('should call trackPresence on the channel engine', () => {
            const presence: PondPresence = { status: 'online' };

            eventResponse.trackPresence(presence);
            expect(mockChannelEngine.trackPresence).toHaveBeenCalledWith('user1', presence);
        });

        it('should call trackPresence with a specific user ID if provided', () => {
            const presence: PondPresence = { status: 'online' };
            const userId = 'user2';

            eventResponse.trackPresence(presence, userId);
            expect(mockChannelEngine.trackPresence).toHaveBeenCalledWith(userId, presence);
        });
    });

    describe('updatePresence', () => {
        it('should call updatePresence on the channel engine', () => {
            const presence: PondPresence = { status: 'away' };

            eventResponse.updatePresence(presence);
            expect(mockChannelEngine.updatePresence).toHaveBeenCalledWith('user1', presence);
        });

        it('should call updatePresence with a specific user ID if provided', () => {
            const presence: PondPresence = { status: 'away' };
            const userId = 'user2';

            eventResponse.updatePresence(presence, userId);
            expect(mockChannelEngine.updatePresence).toHaveBeenCalledWith(userId, presence);
        });
    });

    describe('evictUser', () => {
        it('should call kickUser on the channel engine', () => {
            const reason = 'Violated rules';

            eventResponse.evictUser(reason);
            expect(mockChannelEngine.kickUser).toHaveBeenCalledWith('user1', reason);
        });

        it('should call kickUser with a specific user ID if provided', () => {
            const reason = 'Violated rules';
            const userId = 'user2';

            eventResponse.evictUser(reason, userId);
            expect(mockChannelEngine.kickUser).toHaveBeenCalledWith(userId, reason);
        });
    });

    describe('removePresence', () => {
        it('should call removePresence on the channel engine', () => {
            eventResponse.removePresence();
            expect(mockChannelEngine.removePresence).toHaveBeenCalledWith('user1');
        });

        it('should call removePresence with a specific user ID if provided', () => {
            const userId = 'user2';

            eventResponse.removePresence(userId);
            expect(mockChannelEngine.removePresence).toHaveBeenCalledWith(userId);
        });
    });
});
