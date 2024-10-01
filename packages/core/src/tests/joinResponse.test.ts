import { ServerActions, PondPresence, PondAssigns, PondMessage, ErrorTypes } from '@eleven-am/pondsocket-common';

import { RequestCache } from '../abstracts/types';
import { HttpError } from '../errors/httpError';
import { JoinResponse } from '../responses/joinResponse';
import { MockChannelEngine } from './mocks/channelEnegine';


describe('JoinResponse', () => {
    let mockChannelEngine: MockChannelEngine;
    let joinResponse: JoinResponse;
    let mockUser: RequestCache;

    beforeEach(() => {
        mockChannelEngine = new MockChannelEngine();
        mockChannelEngine.name = 'test-channel';
        mockUser = {
            clientId: 'user1',
            socket: {} as any,
            assigns: { role: 'user' },
            subscriptions: new Set(),
            channelName: 'test-channel',
            requestId: 'request-123',
        };
        joinResponse = new JoinResponse(mockUser, mockChannelEngine);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('accept', () => {
        it('should add user to the channel and mark as accepted', () => {
            const addUserSpy = jest.spyOn(mockChannelEngine, 'addUser');

            joinResponse.accept();
            expect(addUserSpy).toHaveBeenCalledWith('user1', { role: 'user' }, expect.any(Function));
        });

        it('should throw an error if already executed', () => {
            joinResponse.accept();
            expect(() => joinResponse.accept()).toThrow(HttpError);
        });
    });

    describe('decline', () => {
        it('should send an error message and mark as executed', () => {
            const sendMessageSpy = jest.spyOn(mockChannelEngine.parent.parent, 'sendMessage');

            joinResponse.decline('Unauthorized', 401);
            expect(sendMessageSpy).toHaveBeenCalledWith({} as any, expect.objectContaining({
                event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
                action: ServerActions.ERROR,
                payload: {
                    message: 'Unauthorized',
                    code: 401,
                },
            }));
        });

        it('should throw an error if already executed', () => {
            joinResponse.decline();
            expect(() => joinResponse.decline()).toThrow(HttpError);
        });
    });

    describe('assign', () => {
        it('should update assigns if not accepted', () => {
            const newAssigns: PondAssigns = { role: 'admin' };

            joinResponse.assign(newAssigns);
            joinResponse.accept();
            expect(mockChannelEngine.addUser).toHaveBeenCalledWith('user1', { role: 'admin' }, expect.any(Function));
        });

        it('should call updateAssigns on channel engine if already accepted', () => {
            joinResponse.accept();
            const newAssigns: PondAssigns = { role: 'admin' };

            joinResponse.assign(newAssigns);
            expect(mockChannelEngine.updateAssigns).toHaveBeenCalledWith('user1', newAssigns);
        });
    });

    describe('reply', () => {
        it('should send a message to the user', () => {
            const sendMessageSpy = jest.spyOn(mockChannelEngine.parent.parent, 'sendMessage');
            const event = 'test-event';
            const payload: PondMessage = { message: 'Test message' };

            joinResponse.reply(event, payload);
            expect(sendMessageSpy).toHaveBeenCalledWith({} as any, expect.objectContaining({
                event,
                action: ServerActions.SYSTEM,
                payload,
            }));
        });
    });

    describe('broadcastTo', () => {
        it('should call sendMessage on channel engine with specific user IDs', () => {
            const event = 'broadcast-to-event';
            const payload: PondMessage = { message: 'Broadcast to message' };
            const userIds = ['user2', 'user3'];

            joinResponse.broadcastTo(event, payload, userIds);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith('user1', userIds, ServerActions.BROADCAST, event, payload, 'request-123');
        });
    });

    describe('broadcast', () => {
        it('should call sendMessage on channel engine with ALL_USERS', () => {
            const event = 'broadcast-event';
            const payload: PondMessage = { message: 'Broadcast message' };

            joinResponse.broadcast(event, payload);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith('user1', 'ALL_USERS', ServerActions.BROADCAST, event, payload, 'request-123');
        });
    });

    describe('broadcastFrom', () => {
        it('should call sendMessage on channel engine with ALL_EXCEPT_SENDER', () => {
            const event = 'broadcast-from-event';
            const payload: PondMessage = { message: 'Broadcast from message' };

            joinResponse.broadcastFrom(event, payload);
            expect(mockChannelEngine.sendMessage).toHaveBeenCalledWith('user1', 'ALL_EXCEPT_SENDER', ServerActions.BROADCAST, event, payload, 'request-123');
        });
    });

    describe('trackPresence', () => {
        it('should call trackPresence on channel engine', () => {
            const presence: PondPresence = { status: 'online' };

            joinResponse.trackPresence(presence);
            expect(mockChannelEngine.trackPresence).toHaveBeenCalledWith('user1', presence);
        });
    });
});
