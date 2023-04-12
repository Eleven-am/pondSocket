import { ChannelEngine, ServerActions } from './channelEngine';
import { PresenceEventTypes } from '../presence/presenceEngine';

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

        expect(channelEngine['_users'].size).toEqual(0);
        expect(channelEngine.getUserData('test')).not.toBeDefined();
        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine['_users'].size).toEqual(1);
        expect(channelEngine['_users'].get('test')).toEqual({ test: 1 });
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

        expect(channelEngine['_presenceEngine']).not.toBeDefined();
        channelEngine.trackPresence('test', { test: 2 });
        expect(channelEngine['_presenceEngine']).toBeDefined();
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
        }).toThrow('ChannelEngine: User with id test already has a presence subscription in channel test');
    });

    it('should be able to list presence', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        expect(channelEngine.getPresence()).toEqual({});
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
        expect(channelEngine.getPresence()).toEqual({
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
        channelEngine.updatePresence('test', { test: 3 });
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
            channelEngine.updatePresence('test', { test: 2 });
        }).toThrow('ChannelEngine: User with id test does not exist in channel testChannel');
    });

    it('should throw error if user is not tracking presence', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(() => {
            channelEngine.updatePresence('test', { test: 2 });
        }).toThrow('ChannelEngine: Presence engine is not initialized');
    });

    it('should remove user from channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine['_users'].size).toEqual(1);
        expect(channelEngine.getUserData('test')).toBeDefined();
        channelEngine.removeUser('test');
        expect(channelEngine['_users'].size).toEqual(0);
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
        expect(channelEngine.getPresence()).toEqual({
            test: { test: 2 },
            test2: { test: 2 },
        });
        onMessage.mockClear();
        channelEngine.removeUser('test');
        expect(channelEngine.getPresence()).toEqual({
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
            channelEngine.unTrackPresence('test1', false);
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
            channelEngine.unTrackPresence('test', true);
        }).not.toThrow();
    });

    it('should be able to kick a user from the channel', () => {
        const onMessage = jest.fn();
        const parentEngine = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.kickUser('test2', 'test reason');
        expect(channelEngine['_users'].size).toEqual(1);
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
        channelEngine.sendMessage('channel', 'all_users', ServerActions.BROADCAST, 'test', { test: 2 });

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

        channelEngine.sendMessage('test2', 'all_except_sender', ServerActions.BROADCAST, 'test', { test: 3 });
        expect(onMessage).toHaveBeenCalledTimes(1);

        onMessage.mockClear();

        // when user is not in channel it throws an error
        expect(() => {
            channelEngine.sendMessage('test3', 'all_except_sender', ServerActions.BROADCAST, 'test', { test: 3 });
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
        channelEngine.sendMessage('test2', 'all_except_sender', ServerActions.BROADCAST, 'test', { test: 2 });

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
            channelEngine.sendMessage('test3', 'all_except_sender', ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: User with id test3 does not exist in channel test');

        // when sender is channel itself it throws an error
        expect(() => {
            channelEngine.sendMessage('channel', 'all_except_sender', ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: Cannot send to all users except sender when sender is channel');
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
});
