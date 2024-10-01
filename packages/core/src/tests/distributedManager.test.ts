import { PondAssigns, PondPresence, ServerActions } from '@eleven-am/pondsocket-common';

import { InternalChannelEvent } from '../abstracts/types';
import { DistributedManager } from '../managers/distributedManager';
import { MockClient } from './mocks/mockClient';

describe('DistributedManager', () => {
    let distributedManager: DistributedManager;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient('test-channel');

        distributedManager = new DistributedManager(mockClient);
        // Initialize the manager
        distributedManager.initialize(jest.fn());
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trackPresence', () => {
        it('should track presence, publish change, and broadcast the message', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };
            const broadcastSpy = jest.spyOn(distributedManager, 'broadcast');

            distributedManager.trackPresence(userId, presence);

            expect(mockClient.publishPresenceChange).toHaveBeenCalledWith(userId, presence);
            expect(broadcastSpy).toHaveBeenCalledWith(expect.objectContaining({
                event: 'JOIN',
                action: ServerActions.PRESENCE,
                channelName: 'test-channel',
                payload: expect.objectContaining({
                    changed: presence,
                    presence: [presence],
                }),
                recipients: [userId],
            }));
        });
    });

    describe('updatePresence', () => {
        it('should update presence, publish change, and broadcast the message', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };
            const updatedPresence: PondPresence = { status: 'away' };
            const broadcastSpy = jest.spyOn(distributedManager, 'broadcast');

            distributedManager.trackPresence(userId, presence);
            distributedManager.updatePresence(userId, updatedPresence);

            expect(mockClient.publishPresenceChange).toHaveBeenCalledWith(userId, updatedPresence);
            expect(broadcastSpy).toHaveBeenLastCalledWith(expect.objectContaining({
                event: 'UPDATE',
                action: ServerActions.PRESENCE,
                payload: expect.objectContaining({
                    changed: updatedPresence,
                    presence: [updatedPresence],
                }),
            }));
        });
    });

    describe('removePresence', () => {
        it('should remove presence, publish change, and broadcast the message', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };
            const broadcastSpy = jest.spyOn(distributedManager, 'broadcast');

            distributedManager.trackPresence(userId, presence);
            distributedManager.removePresence(userId);

            expect(mockClient.publishPresenceChange).toHaveBeenCalledWith(userId, null);
            expect(broadcastSpy).toHaveBeenLastCalledWith(expect.objectContaining({
                event: 'LEAVE',
                action: ServerActions.PRESENCE,
                payload: expect.objectContaining({
                    changed: presence,
                    presence: [],
                }),
            }));
        });
    });

    describe('setAssigns', () => {
        it('should set assigns for a user and publish change', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };

            distributedManager.setAssigns(userId, assigns);

            expect(mockClient.publishAssignsChange).toHaveBeenCalledWith(userId, assigns);
            expect(distributedManager.getAssigns(userId)).toEqual(assigns);
        });
    });

    describe('updateAssigns', () => {
        it('should update assigns for a user and publish change', () => {
            const userId = 'user1';
            const initialAssigns: PondAssigns = { role: 'user' };
            const updatedAssigns: PondAssigns = { role: 'admin' };

            distributedManager.setAssigns(userId, initialAssigns);
            distributedManager.updateAssigns(userId, updatedAssigns);

            expect(mockClient.publishAssignsChange).toHaveBeenCalledWith(userId, updatedAssigns);
            expect(distributedManager.getAssigns(userId)).toEqual(updatedAssigns);
        });
    });

    describe('removeAssigns', () => {
        it('should remove assigns for a user and publish change', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };

            distributedManager.setAssigns(userId, assigns);
            distributedManager.removeAssigns(userId);

            expect(mockClient.publishAssignsChange).toHaveBeenCalledWith(userId, null);
            expect(distributedManager.getAssigns(userId)).toBeNull();
        });
    });

    describe('removeUser', () => {
        it('should remove user data, publish user leave, and call unsubscribe', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };
            const presence: PondPresence = { status: 'online' };
            const unsubscribeMock = jest.fn();

            distributedManager.addUser(userId, assigns, jest.fn());
            distributedManager.trackPresence(userId, presence);

            // @ts-expect-error - Accessing private property for testing
            distributedManager.userSubscriptions.set(userId, unsubscribeMock);

            const userData = distributedManager.removeUser(userId);

            expect(userData).toEqual({
                id: userId,
                assigns,
                presence,
            });
            expect(mockClient.publishUserLeave).toHaveBeenCalledWith(userId);
            expect(unsubscribeMock).toHaveBeenCalled();
            expect(distributedManager.getAssigns(userId)).toBeNull();
            expect(distributedManager.getPresence(userId)).toBeNull();
        });
    });

    describe('broadcast', () => {
        it('should publish the channel message', () => {
            const message: InternalChannelEvent = {
                event: 'test-event',
                action: ServerActions.BROADCAST,
                channelName: 'test-channel',
                requestId: 'test-request-id',
                payload: { data: 'test-data' },
                recipients: ['user1', 'user2'],
            };

            distributedManager.broadcast(message);

            expect(mockClient.publishChannelMessage).toHaveBeenCalledWith(message);
        });
    });

    describe('addUser', () => {
        it('should add user data and create a subscription', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'user' };
            const onMessageMock = jest.fn();

            distributedManager.addUser(userId, assigns, onMessageMock);

            expect(distributedManager.getAssigns(userId)).toEqual(assigns);
            expect(distributedManager['userSubscriptions'].has(userId)).toBeTruthy();
        });
    });

    describe('getAllPresence', () => {
        it('should return all presence data', () => {
            const user1 = 'user1';
            const user2 = 'user2';
            const presence1: PondPresence = { status: 'online' };
            const presence2: PondPresence = { status: 'away' };

            distributedManager.trackPresence(user1, presence1);
            distributedManager.trackPresence(user2, presence2);

            const allPresence = distributedManager.getAllPresence();

            expect(allPresence.get(user1)).toEqual(presence1);
            expect(allPresence.get(user2)).toEqual(presence2);
        });
    });

    describe('upsertPresence', () => {
        it('should update presence if user exists', () => {
            const userId = 'user1';
            const initialPresence: PondPresence = { status: 'online' };
            const updatedPresence: PondPresence = { status: 'away' };

            distributedManager.trackPresence(userId, initialPresence);
            distributedManager.upsertPresence(userId, updatedPresence);

            expect(distributedManager.getPresence(userId)).toEqual(updatedPresence);
            expect(mockClient.publishPresenceChange).toHaveBeenLastCalledWith(userId, updatedPresence);
        });

        it('should create presence if user does not exist', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };

            distributedManager.upsertPresence(userId, presence);

            expect(distributedManager.getPresence(userId)).toEqual(presence);
            expect(mockClient.publishPresenceChange).toHaveBeenCalledWith(userId, presence);
        });
    });

    describe('getAllAssigns', () => {
        it('should return all assigns data', () => {
            const user1 = 'user1';
            const user2 = 'user2';
            const assigns1: PondAssigns = { role: 'admin' };
            const assigns2: PondAssigns = { role: 'user' };

            distributedManager.setAssigns(user1, assigns1);
            distributedManager.setAssigns(user2, assigns2);

            const allAssigns = distributedManager.getAllAssigns();

            expect(allAssigns.get(user1)).toEqual(assigns1);
            expect(allAssigns.get(user2)).toEqual(assigns2);
        });
    });

    describe('initialize', () => {
        it('should initialize the manager, set up subscriptions, and fetch initial data', async () => {
            const unsubscribeMock = jest.fn();

            mockClient.getPresenceCache.mockResolvedValue(new Map());
            mockClient.getAssignsCache.mockResolvedValue(new Map());

            await distributedManager.initialize(unsubscribeMock);

            expect(mockClient.getPresenceCache).toHaveBeenCalled();
            expect(mockClient.getAssignsCache).toHaveBeenCalled();
            expect(mockClient.subscribeToUserLeaves).toHaveBeenCalled();
            expect(mockClient.subscribeToPresenceChanges).toHaveBeenCalled();
            expect(mockClient.subscribeToAssignsChanges).toHaveBeenCalled();
            expect(mockClient.subscribeToChannelMessages).toHaveBeenCalled();
        });
    });

    describe('close', () => {
        it('should clear all data, close the publisher, and call unsubscribe', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };
            const presence: PondPresence = { status: 'online' };
            const unsubscribeMock = jest.fn();

            distributedManager.addUser(userId, assigns, jest.fn());
            distributedManager.trackPresence(userId, presence);

            // @ts-expect-error - Accessing private property for testing
            distributedManager.userSubscriptions.set(userId, unsubscribeMock);

            // @ts-expect-error - Accessing private property for testing
            distributedManager['#subscriptions'] = jest.fn();

            const publisherCloseSpy = jest.spyOn(distributedManager['publisher'], 'close');

            distributedManager.close();

            expect(unsubscribeMock).toHaveBeenCalled();
            expect(distributedManager.getAllPresence().size).toBe(0);
            expect(distributedManager.getAllAssigns().size).toBe(0);
            expect(distributedManager['userSubscriptions'].size).toBe(0);
            expect(publisherCloseSpy).toHaveBeenCalled();
        });
    });

    describe('getUserData', () => {
        it('should return user data if user exists', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };
            const presence: PondPresence = { status: 'online' };

            distributedManager.addUser(userId, assigns, jest.fn());
            distributedManager.trackPresence(userId, presence);

            const userData = distributedManager.getUserData(userId);

            expect(userData).toEqual({
                id: userId,
                assigns,
                presence,
            });
        });

        it('should throw an error if user does not exist', () => {
            const userId = 'nonexistent';

            expect(() => distributedManager.getUserData(userId)).toThrow();
        });
    });
});
