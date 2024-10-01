import { ChannelReceiver, ServerActions, PondPresence, PondAssigns, ClientActions } from '@eleven-am/pondsocket-common';

import { ChannelEngine } from '../engines/channelEngine';
import { HttpError } from '../errors/httpError';
import { EventResponse } from '../responses/eventResponse';
import { MockLobbyEngine } from './mocks/lobbyEngine';
import { MockManager } from './mocks/manager';


describe('ChannelEngine', () => {
    let channelEngine: ChannelEngine;
    let mockLobbyEngine: MockLobbyEngine;
    let mockManager: MockManager;

    beforeEach(() => {
        mockLobbyEngine = new MockLobbyEngine();
        mockManager = new MockManager();
        channelEngine = new ChannelEngine(mockLobbyEngine, 'test-channel', mockManager);

        mockManager.userIds = new Set(['user1', 'user2']);
        mockManager.getAllAssigns.mockReturnValue(new Map([
            ['user1', { username: 'User1' }],
            ['user2', { username: 'User2' }],
        ]));
        mockManager.getAllPresence.mockReturnValue(new Map([
            ['user1', { status: 'online' }],
            ['user2', { status: 'away' }],
        ]));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addUser', () => {
        it('should add a user successfully', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { username: 'TestUser' };
            const onMessage = jest.fn();

            mockManager.userIds = new Set();

            mockManager.addUser.mockImplementation((userId) => mockManager.userIds.add(userId));

            expect(() => channelEngine.addUser(userId, assigns, onMessage)).not.toThrow();
            expect(mockManager.addUser).toHaveBeenCalledWith(userId, assigns, expect.any(Function));
        });

        it('should throw an error if user already exists', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { username: 'TestUser' };
            const onMessage = jest.fn();

            mockManager.userIds = new Set([userId]);

            expect(() => channelEngine.addUser(userId, assigns, onMessage)).toThrow(HttpError);
        });
    });

    describe('sendMessage', () => {
        it('should send a message successfully', () => {
            const sender = 'user1';
            const recipient = ChannelReceiver.ALL_USERS;
            const action = ServerActions.BROADCAST;
            const event = 'test-event';
            const payload = { message: 'Hello, World!' };

            mockManager.userIds = new Set([sender]);
            mockManager.broadcast.mockImplementation(() => {});

            channelEngine.sendMessage(sender, recipient, action, event, payload);

            expect(mockManager.broadcast).toHaveBeenCalledWith(expect.objectContaining({
                channelName: 'test-channel',
                action,
                event,
                payload,
                recipients: expect.any(Array),
            }));
        });

        it('should throw an error if sender does not exist', () => {
            const sender = 'non-existent-user';
            const recipient = ChannelReceiver.ALL_USERS;
            const action = ServerActions.BROADCAST;
            const event = 'test-event';
            const payload = { message: 'Hello, World!' };

            mockManager.userIds = new Set();

            expect(() => channelEngine.sendMessage(sender, recipient, action, event, payload)).toThrow(HttpError);
        });
    });

    describe('broadcastMessage', () => {
        it('should broadcast a message successfully', () => {
            const userId = 'user1';
            const message = {
                event: 'test-event',
                payload: { message: 'Hello, World!' },
                requestId: 'req1',
                channelName: 'test-channel',
                action: ClientActions.BROADCAST,
            };

            mockManager.userIds = new Set([userId]);
            const middlewareRunSpy = jest.spyOn(mockLobbyEngine.middleware, 'run');

            middlewareRunSpy.mockImplementation((req, res, next) => {
                const response = new EventResponse(req, res);

                response.broadcast(message.event, message.payload);

                next();
            });

            channelEngine.broadcastMessage(userId, message);
            expect(middlewareRunSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    sender: userId,
                    action: ServerActions.BROADCAST,
                    event: message.event,
                    payload: message.payload,
                    requestId: message.requestId,
                    channelName: message.channelName,
                }),
                channelEngine,
                expect.any(Function),
            );

            expect(mockManager.broadcast).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: ServerActions.BROADCAST,
                    event: message.event,
                    payload: message.payload,
                }),
            );
        });

        it('should throw an error if user does not exist', () => {
            const userId = 'non-existent-user';
            const message = {
                event: 'test-event',
                payload: { message: 'Hello, World!' },
                requestId: 'req1',
                channelName: 'test-channel',
                action: ClientActions.BROADCAST,
            };

            mockManager.userIds = new Set();

            expect(() => channelEngine.broadcastMessage(userId, message)).toThrow(HttpError);
        });
    });

    describe('presence management', () => {
        const userId = 'user1';
        const presence: PondPresence = { status: 'online' };

        beforeEach(() => {
            mockManager.userIds = new Set([userId]);
        });

        it('should track presence successfully', () => {
            mockManager.trackPresence.mockImplementation(() => {});

            channelEngine.trackPresence(userId, presence);
            expect(mockManager.trackPresence).toHaveBeenCalledWith(userId, presence);
        });

        it('should update presence successfully', () => {
            mockManager.updatePresence.mockImplementation(() => {});

            channelEngine.updatePresence(userId, presence);
            expect(mockManager.updatePresence).toHaveBeenCalledWith(userId, presence);
        });

        it('should remove presence successfully', () => {
            mockManager.removePresence.mockImplementation(() => {});

            channelEngine.removePresence(userId);
            expect(mockManager.removePresence).toHaveBeenCalledWith(userId);
        });

        it('should upsert presence successfully', () => {
            mockManager.upsertPresence.mockImplementation(() => {});

            channelEngine.upsertPresence(userId, presence);
            expect(mockManager.upsertPresence).toHaveBeenCalledWith(userId, presence);
        });
    });

    describe('assigns management', () => {
        it('should update assigns successfully', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { username: 'UpdatedUser' };

            mockManager.updateAssigns.mockImplementation(() => {});

            channelEngine.updateAssigns(userId, assigns);
            expect(mockManager.updateAssigns).toHaveBeenCalledWith(userId, assigns);
        });
    });

    describe('kickUser', () => {
        it('should kick a user successfully', () => {
            const userId = 'user1';
            const reason = 'Violation of rules';

            mockManager.userIds = new Set([userId]);
            mockManager.removeUser.mockImplementation(() => ({ id: userId,
                assigns: {},
                presence: {} }));
            mockManager.broadcast.mockImplementation(() => {});

            channelEngine.kickUser(userId, reason);

            expect(mockManager.broadcast).toHaveBeenCalledTimes(2);
            expect(mockManager.removeUser).toHaveBeenCalledWith(userId);
        });
    });

    describe('getAssigns and getPresence', () => {
        it('should return assigns for all users', () => {
            const assigns = new Map([
                ['user1', { username: 'User1' }],
                ['user2', { username: 'User2' }],
            ]);

            mockManager.getAllAssigns.mockReturnValue(assigns);

            const result = channelEngine.getAssigns();

            expect(result).toEqual({ user1: { username: 'User1' },
                user2: { username: 'User2' } });
        });

        it('should return presence for all users', () => {
            const presence = new Map([
                ['user1', { status: 'online' }],
                ['user2', { status: 'away' }],
            ]);

            mockManager.getAllPresence.mockReturnValue(presence);

            const result = channelEngine.getPresence();

            expect(result).toEqual({ user1: { status: 'online' },
                user2: { status: 'away' } });
        });
    });

    describe('destroy', () => {
        it('should destroy the channel', () => {
            const reason = 'Channel closed';

            mockManager.broadcast.mockImplementation(() => {});
            mockManager.close.mockImplementation(() => {});

            channelEngine.destroy(reason);

            expect(mockManager.broadcast).toHaveBeenCalledWith(expect.objectContaining({
                action: ServerActions.ERROR,
                event: 'destroyed',
                payload: { message: reason },
            }));
            expect(mockManager.close).toHaveBeenCalled();
        });
    });

    describe('removeUser', () => {
        it('should remove a user and call leaveCallback if set', () => {
            const userId = 'user1';
            const userData = { id: userId,
                assigns: {},
                presence: {} };

            mockManager.removeUser.mockReturnValue(userData);
            mockLobbyEngine.leaveCallback = jest.fn();

            channelEngine.removeUser(userId);

            expect(mockManager.removeUser).toHaveBeenCalledWith(userId);
            expect(mockLobbyEngine.leaveCallback).toHaveBeenCalledWith(expect.objectContaining({
                user: userData,
                channel: expect.any(Object),
            }));
        });
    });

    describe('getUser', () => {
        it('should return user data', () => {
            const userId = 'user1';
            const userData = { id: userId,
                assigns: {},
                presence: {} };

            mockManager.getUserData.mockReturnValue(userData);

            const result = channelEngine.getUser(userId);

            expect(result).toEqual(userData);
        });
    });

    describe('ChannelEngine additional methods', () => {
        it('should return all users', () => {
            const users = new Set(['user1', 'user2']);

            mockManager.userIds = users;

            expect(channelEngine.users).toEqual(users);
        });

        it('should return the channel name', () => {
            expect(channelEngine.name).toBe('test-channel');
        });
    });
});
