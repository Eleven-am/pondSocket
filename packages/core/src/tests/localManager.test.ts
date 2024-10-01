import { PondAssigns, PondPresence, ServerActions } from '@eleven-am/pondsocket-common';

import { InternalChannelEvent } from '../abstracts/types';
import { LocalManager } from '../managers/localManager';


describe('LocalManager', () => {
    let localManager: LocalManager;

    beforeEach(() => {
        localManager = new LocalManager('test-channel');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trackPresence', () => {
        it('should track presence and broadcast the message', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };
            const broadcastSpy = jest.spyOn(localManager, 'broadcast');

            localManager.trackPresence(userId, presence);

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
        it('should update presence and broadcast the message', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };
            const updatedPresence: PondPresence = { status: 'away' };
            const broadcastSpy = jest.spyOn(localManager, 'broadcast');

            localManager.trackPresence(userId, presence);
            localManager.updatePresence(userId, updatedPresence);

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
        it('should remove presence and broadcast the message', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };
            const broadcastSpy = jest.spyOn(localManager, 'broadcast');

            localManager.trackPresence(userId, presence);
            localManager.removePresence(userId);

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
        it('should set assigns for a user', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };

            localManager.setAssigns(userId, assigns);

            expect(localManager.getAssigns(userId)).toEqual(assigns);
        });
    });

    describe('updateAssigns', () => {
        it('should update assigns for a user', () => {
            const userId = 'user1';
            const initialAssigns: PondAssigns = { role: 'user' };
            const updatedAssigns: PondAssigns = { role: 'admin' };

            localManager.setAssigns(userId, initialAssigns);
            localManager.updateAssigns(userId, updatedAssigns);

            expect(localManager.getAssigns(userId)).toEqual(updatedAssigns);
        });
    });

    describe('removeAssigns', () => {
        it('should remove assigns for a user', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };

            localManager.setAssigns(userId, assigns);
            localManager.removeAssigns(userId);

            expect(localManager.getAssigns(userId)).toBeNull();
        });
    });

    describe('removeUser', () => {
        it('should remove user data and call unsubscribe', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };
            const presence: PondPresence = { status: 'online' };
            const unsubscribeMock = jest.fn();

            localManager.addUser(userId, assigns, jest.fn());
            localManager.trackPresence(userId, presence);

            // @ts-expect-error - Accessing private property for testing
            localManager.userSubscriptions.set(userId, unsubscribeMock);

            const userData = localManager.removeUser(userId);

            expect(userData).toEqual({
                id: userId,
                assigns,
                presence,
            });
            expect(unsubscribeMock).toHaveBeenCalled();
            expect(localManager.getAssigns(userId)).toBeNull();
            expect(localManager.getPresence(userId)).toBeNull();
        });
    });

    describe('broadcast', () => {
        it('should publish the message to subscribers', () => {
            const message: InternalChannelEvent = {
                event: 'test-event',
                action: ServerActions.BROADCAST,
                channelName: 'test-channel',
                requestId: 'test-request-id',
                payload: { data: 'test-data' },
                recipients: ['user1', 'user2'],
            };

            const publishSpy = jest.spyOn(localManager['publisher'], 'publish');

            localManager.broadcast(message);

            expect(publishSpy).toHaveBeenCalledWith(message);
        });
    });

    describe('addUser', () => {
        it('should add user data and create a subscription', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'user' };
            const onMessageMock = jest.fn();

            localManager.addUser(userId, assigns, onMessageMock);

            expect(localManager.getAssigns(userId)).toEqual(assigns);
            expect(localManager['userSubscriptions'].has(userId)).toBeTruthy();
        });
    });

    describe('getAllPresence', () => {
        it('should return all presence data', () => {
            const user1 = 'user1';
            const user2 = 'user2';
            const presence1: PondPresence = { status: 'online' };
            const presence2: PondPresence = { status: 'away' };

            localManager.trackPresence(user1, presence1);
            localManager.trackPresence(user2, presence2);

            const allPresence = localManager.getAllPresence();

            expect(allPresence.get(user1)).toEqual(presence1);
            expect(allPresence.get(user2)).toEqual(presence2);
        });
    });

    describe('upsertPresence', () => {
        it('should update presence if user exists', () => {
            const userId = 'user1';
            const initialPresence: PondPresence = { status: 'online' };
            const updatedPresence: PondPresence = { status: 'away' };

            localManager.trackPresence(userId, initialPresence);
            localManager.upsertPresence(userId, updatedPresence);

            expect(localManager.getPresence(userId)).toEqual(updatedPresence);
        });

        it('should create presence if user does not exist', () => {
            const userId = 'user1';
            const presence: PondPresence = { status: 'online' };

            localManager.upsertPresence(userId, presence);

            expect(localManager.getPresence(userId)).toEqual(presence);
        });
    });

    describe('getAllAssigns', () => {
        it('should return all assigns data', () => {
            const user1 = 'user1';
            const user2 = 'user2';
            const assigns1: PondAssigns = { role: 'admin' };
            const assigns2: PondAssigns = { role: 'user' };

            localManager.setAssigns(user1, assigns1);
            localManager.setAssigns(user2, assigns2);

            const allAssigns = localManager.getAllAssigns();

            expect(allAssigns.get(user1)).toEqual(assigns1);
            expect(allAssigns.get(user2)).toEqual(assigns2);
        });
    });

    describe('initialize', () => {
        it('should initialize the manager and return a resolved promise', async () => {
            const unsubscribeMock = jest.fn();

            await expect(localManager.initialize(unsubscribeMock)).resolves.toBeUndefined();
        });
    });

    describe('close', () => {
        it('should clear all data and close the publisher', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };
            const presence: PondPresence = { status: 'online' };
            const unsubscribeMock = jest.fn();

            localManager.addUser(userId, assigns, jest.fn());
            localManager.trackPresence(userId, presence);

            // @ts-expect-error - Accessing private property for testing
            localManager.userSubscriptions.set(userId, unsubscribeMock);

            const publisherCloseSpy = jest.spyOn(localManager['publisher'], 'close');

            localManager.close();

            expect(unsubscribeMock).toHaveBeenCalled();
            expect(localManager.getAllPresence().size).toBe(0);
            expect(localManager.getAllAssigns().size).toBe(0);
            expect(localManager['userSubscriptions'].size).toBe(0);
            expect(publisherCloseSpy).toHaveBeenCalled();
        });
    });

    describe('getUserData', () => {
        it('should return user data if user exists', () => {
            const userId = 'user1';
            const assigns: PondAssigns = { role: 'admin' };
            const presence: PondPresence = { status: 'online' };

            localManager.addUser(userId, assigns, jest.fn());
            localManager.trackPresence(userId, presence);

            const userData = localManager.getUserData(userId);

            expect(userData).toEqual({
                id: userId,
                assigns,
                presence,
            });
        });

        it('should throw an error if user does not exist', () => {
            const userId = 'nonexistent';

            expect(() => localManager.getUserData(userId)).toThrow();
        });
    });
});
