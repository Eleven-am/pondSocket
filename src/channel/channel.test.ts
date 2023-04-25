import { ChannelEngine } from './channel';
import { EventRequest } from './eventRequest';
import { EventResponse } from './eventResponse';
import { ServerActions, PresenceEventTypes, SystemSender, ChannelReceiver, ClientActions, ErrorTypes } from '../enums';

export const createParentEngine = () => {
    const parentEngine = {
        destroyChannel: jest.fn(),
        execute: jest.fn(),
    };

    return parentEngine as any;
};

describe('ChannelEngine', () => {
    it('should add user to channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        expect(channelEngine.size).toEqual(0);
        expect(channelEngine.getUserData('test')).not.toBeDefined();
        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine.size).toEqual(1);
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: {},
            id: 'test',
        });
    });

    it('should throw error if user is already in channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(() => {
            channelEngine.addUser('test', { test: 1 }, onMessage);
        }).toThrow('ChannelEngine: User with id test already exists in channel testChannel');
    });

    it('should update a users assigns', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: {},
            id: 'test',
        });
        channelEngine.updateAssigns('test', { test: 2 });
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 2 },
            presence: {},
            id: 'test',
        });
    });

    it('should throw error if user is not in channel', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        expect(() => {
            channelEngine.updateAssigns('test', { test: 2 });
        }).toThrow('ChannelEngine: User with id test does not exist in channel testChannel');
    });

    it('should be able to get users assigns in the channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        expect(channelEngine.getAssigns()).toEqual({});
        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine.getAssigns()).toEqual({
            test: { test: 1 },
        });
        channelEngine.addUser('test2', { test: 2 }, onMessage);
        expect(channelEngine.getAssigns()).toEqual({
            test: { test: 1 },
            test2: { test: 2 },
        });
    });

    it('should be able to track presence', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: {},
            id: 'test',
        });

        expect(channelEngine.presenceEngine).not.toBeDefined();
        channelEngine.trackPresence('test', { test: 2 });
        expect(channelEngine.presenceEngine).toBeDefined();
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: { test: 2 },
            id: 'test',
        });
    });

    it('should throw error if user is not in channel', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        expect(() => {
            channelEngine.trackPresence('test', { test: 2 });
        }).toThrow('ChannelEngine: User with id test does not exist in channel testChannel');
    });

    it('should throw error if channel is already tracking the users presence', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.trackPresence('test', { test: 2 });
        expect(() => {
            channelEngine.trackPresence('test', { test: 2 });
        }).toThrow('PresenceEngine: Presence with key test already exists');
    });

    it('should be able to list presence', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 2 }, onMessage);
        channelEngine.trackPresence('test', { test: 2 });
        expect(onMessage).toHaveBeenCalledWith({
            channelName: 'test',
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.JOIN,
            payload: {
                presence: [{ test: 2 }],
                changed: {
                    test: 2,
                },
            },
        });

        channelEngine.trackPresence('test2', { test: 3 });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            test: { test: 2 },
            test2: { test: 3 },
        });

        expect(onMessage).toHaveBeenCalledTimes(3);
    });

    it('should update a users presence', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.trackPresence('test', { test: 2 });
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: { test: 2 },
            id: 'test',
        });
        channelEngine.presenceEngine?.updatePresence('test', { test: 3 });
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: { test: 3 },
            id: 'test',
        });
    });

    it('should throw error if user is not in channel', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        expect(() => {
            channelEngine.trackPresence('test', { test: 2 });
        }).toThrow('ChannelEngine: User with id test does not exist in channel testChannel');
    });

    it('should remove user from channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine.size).toEqual(1);
        expect(channelEngine.getUserData('test')).toBeDefined();
        channelEngine.removeUser('test');
        expect(channelEngine.size).toEqual(0);
        expect(channelEngine.getUserData('test')).not.toBeDefined();
    });

    it('should throw error if user is not in channel', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        expect(() => {
            channelEngine.removeUser('test');
        }).toThrow('ChannelEngine: User with id test does not exist in channel testChannel');
    });

    it('should untrack presence when user is removed', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.trackPresence('test', { test: 2 });
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.trackPresence('test2', { test: 2 });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            test: { test: 2 },
            test2: { test: 2 },
        });
        onMessage.mockClear();
        channelEngine.removeUser('test');
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            test2: { test: 2 },
        });
        expect(onMessage).toHaveBeenCalledWith({
            channelName: 'test',
            event: PresenceEventTypes.LEAVE,
            action: ServerActions.PRESENCE,
            payload: {
                presence: [{ test: 2 }],
                changed: {
                    test: 2,
                },
            },
        });
    });

    it('should throw error if user is not in channel and isPond is false', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        // add a user to the channel
        channelEngine.addUser('test', { test: 1 }, jest.fn());

        // track the added user's presence
        channelEngine.trackPresence('test', { test: 2 });

        // we do this because we want to initialize the presence engine
        // the engine is not initialized by default when a channel is created

        expect(() => {
            // now we try to untrack the presence of a user that is not in the channel
            channelEngine.presenceEngine?.removePresence('test1');
        }).toThrow('PresenceEngine: Presence with key test1 does not exist');
    });

    it('should not throw error if user is not in channel and isPond is true', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        // add a user to the channel
        channelEngine.addUser('test', { test: 1 }, jest.fn());

        // track the added user's presence
        channelEngine.trackPresence('test', { test: 2 });

        // we do this because we want to initialize the presence engine
        // the engine is not initialized by default when a xhannel is created

        expect(() => {
            // now we try to untrack the presence of a user that is not in the channel
            channelEngine.presenceEngine?.removePresence('test');
        }).not.toThrow();
    });

    it('should be able to kick a user from the channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.kickUser('test2', 'test reason');
        expect(channelEngine.size).toEqual(1);
        expect(channelEngine.getUserData('test2')).not.toBeDefined();
        expect(onMessage.mock.calls[0][0]).toStrictEqual({
            action: ServerActions.SYSTEM,
            channelName: 'test',
            event: 'kicked_out',
            payload: {
                reason: 'test reason',
                message: 'You have been kicked out of the channel',
            },
        });

        expect(onMessage.mock.calls[1][0]).toStrictEqual({
            action: ServerActions.SYSTEM,
            channelName: 'test',
            event: 'kicked',
            payload: {
                reason: 'test reason',
                userId: 'test2',
            },
        });

        expect(onMessage).toHaveBeenCalledTimes(2);
    });

    it('should call destroy on parent engine', () => {
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.destroy('test');
        expect(parentEngine.destroyChannel).toHaveBeenCalled();
    });

    it('should broadcast a message to all users', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();

        parentEngine.execute = (_: any, res: any) => {
            res.accept();
        };
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, 'test', { test: 2 });

        expect(onMessage.mock.calls[0][0]).toStrictEqual({
            action: ServerActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 2,
            },
        });

        expect(onMessage).toHaveBeenCalledTimes(2);
        onMessage.mockClear();

        channelEngine.sendMessage('test2', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'test', { test: 3 });
        expect(onMessage).toHaveBeenCalledTimes(1);

        onMessage.mockClear();

        // when user is not in channel it throws an error
        expect(() => {
            channelEngine.sendMessage('test3', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: User with id test3 does not exist in channel test');
    });

    it('should broadcast a message to all users except sender', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();

        parentEngine.execute = (_: any, res: any) => {
            res.accept();
        };
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.sendMessage('test2', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'test', { test: 2 });

        expect(onMessage.mock.calls[0][0]).toStrictEqual({
            action: ServerActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 2,
            },
        });

        expect(onMessage).toHaveBeenCalledTimes(1);
        // when user is not in channel it throws an error

        expect(() => {
            channelEngine.sendMessage('test3', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: User with id test3 does not exist in channel test');

        // when sender is channel itself it throws an error
        expect(() => {
            channelEngine.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow(`ChannelEngine: Cannot use ${ChannelReceiver.ALL_EXCEPT_SENDER} with ${SystemSender.CHANNEL}`);
    });

    it('should broadcast a message to  specific users', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();

        parentEngine.execute = (_: any, res: any) => {
            res.accept();
        };
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.addUser('test3', { test: 1 }, onMessage);

        channelEngine.sendMessage('test2', ['test', 'test3'], ServerActions.BROADCAST, 'test', { test: 2 });

        expect(onMessage.mock.calls[0][0]).toStrictEqual({
            action: ServerActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 2,
            },
        });

        expect(onMessage.mock.calls[1][0]).toStrictEqual({
            action: ServerActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 2,
            },
        });

        expect(onMessage).toHaveBeenCalledTimes(2);

        // when recipient is not in channel it throws an error
        expect(() => {
            channelEngine.sendMessage('test3', ['test', 'test3', 'test4'], ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: Users test4 are not in channel test');

        // when sender is not in channel it throws an error
        expect(() => {
            channelEngine.sendMessage('test4', ['test', 'test3'], ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: User with id test4 does not exist in channel test');
    });

    it('should broadcast messages while also triggering the onMessage callback', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        parentEngine.execute = (req: any, res: any) => {
            expect(req).toBeInstanceOf(EventRequest);
            expect(res).toBeInstanceOf(EventResponse);
            res.accept();
        };

        expect(() => channelEngine.broadcastMessage('test2', {
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: { test: 1 },
            addresses: ChannelReceiver.ALL_USERS,
        })).toThrow('ChannelEngine: User with id test2 does not exist in channel test');

        channelEngine.addUser('test2', { test: 1 }, onMessage);

        channelEngine.broadcastMessage('test2', {
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: { test: 1 },
            addresses: ChannelReceiver.ALL_USERS,
        });

        expect(onMessage).toHaveBeenCalledTimes(1);

        let count = 0;

        onMessage.mockClear();
        parentEngine.execute = (req: any, res: any, next: any) => {
            expect(req).toBeInstanceOf(EventRequest);
            expect(res).toBeInstanceOf(EventResponse);
            count++;
            next();
        };

        channelEngine.broadcastMessage('test2', {
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: { test: 1 },
            addresses: ChannelReceiver.ALL_USERS,
        });

        // proves that the message was received by the parent engine
        expect(count).toBe(1);

        // however the onMessage callback was not called
        // because the message was never handled by the parent engine
        expect(onMessage).toHaveBeenCalledWith({
            action: ServerActions.ERROR,
            channelName: 'test',
            event: ErrorTypes.HANDLER_NOT_FOUND,
            payload: {
                code: 404,
                message: 'A handler did not respond to the event',
            },
        });
    });
});
