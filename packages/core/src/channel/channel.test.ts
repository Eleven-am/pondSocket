import {
    ChannelReceiver,
    ClientActions,
    ErrorTypes,
    PresenceEventTypes,
    ServerActions,
    SystemSender,
    uuid,
} from '@eleven-am/pondsocket-common';

import { ChannelEngine } from './channel';
import { EventRequest } from './eventRequest';
import { EventResponse } from './eventResponse';
import { RequestCache } from '../endpoint/endpoint';
import { createEndpointEngine } from '../endpoint/endpoint.test';
import { LobbyEngine } from '../lobby/lobby';

export const createParentEngine = () => {
    const socket: RequestCache = {
        clientId: 'test2',
        assigns: { assign: 'assign' },
        channelName: 'channel',
        requestId: 'requestId',
        subscriptions: new Map(),
        socket: {
            send: jest.fn(),
        } as any,
    };

    const lobbyEngineMock = {
        onEvent: jest.fn(),
        onLeave: jest.fn(),
        broadcast: jest.fn(),
        execute: jest.fn(),
        getChannel: jest.fn(),
        destroyChannel: jest.fn(),
        listChannels: jest.fn(),
        createChannel: jest.fn(),
        parent: createEndpointEngine(socket),
        middleware: {
            run: jest.fn(),
        },
    } as any as LobbyEngine;

    return {
        parentEngine: lobbyEngineMock,
        socket,
    };
};

describe('ChannelEngine', () => {
    it('should add user to channel', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();
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
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(() => {
            channelEngine.addUser('test', { test: 1 }, onMessage);
        }).toThrow('ChannelEngine: User with id test already exists in channel testChannel');
    });

    it('should throw error if user is not in channel: updateAssigns', () => {
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        expect(() => {
            channelEngine.updateAssigns('test', { test: 2 });
        }).toThrow('ChannelEngine: User with id test does not exist in channel testChannel');
    });

    it('should throw error if user is not in channel: removeUser', () => {
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        expect(() => {
            channelEngine.kickUser('test', 'test reason');
        }).toThrow('ChannelEngine: Invalid recipients test some users do not exist in channel testChannel');
    });

    it('should update a users assigns', () => {
        const onMessage = jest.fn();
        const { parentEngine, socket } = createParentEngine();
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

    it('should be able to get users assigns in the channel', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();
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
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: {},
            id: 'test',
        });

        channelEngine.presenceEngine.trackPresence('test', { test: 2 });
        expect(channelEngine.presenceEngine).toBeDefined();
        expect(channelEngine.getUserData('test')).toEqual({
            assigns: { test: 1 },
            presence: { test: 2 },
            id: 'test',
        });
    });

    it('should throw error if channel is already tracking the users presence', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.presenceEngine.trackPresence('test', { test: 2 });
        expect(() => {
            channelEngine.presenceEngine.trackPresence('test', { test: 2 });
        }).toThrow('PresenceEngine: Presence with key test already exists');
    });

    it('should be able to list presence', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 2 }, onMessage);
        channelEngine.presenceEngine.trackPresence('test', { test: 2 });
        expect(onMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                channelName: 'test',
                action: ServerActions.PRESENCE,
                event: PresenceEventTypes.JOIN,
                payload: {
                    presence: [{ test: 2 }],
                    changed: {
                        test: 2,
                    },
                },
            }),
        );

        channelEngine.presenceEngine.trackPresence('test2', { test: 3 });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            test: { test: 2 },
            test2: { test: 3 },
        });

        expect(onMessage).toHaveBeenCalledTimes(5);
    });

    it('should update a users presence', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.presenceEngine.trackPresence('test', { test: 2 });
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

    it('should remove user from channel', () => {
        const onMessage = jest.fn();
        const { parentEngine, socket } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        const unsub = channelEngine.addUser('test1', { test: 1 }, onMessage);

        socket.subscriptions.set('test', unsub);
        expect(channelEngine.size).toEqual(1);
        expect(channelEngine.getUserData('test1')).toBeDefined();
        channelEngine.kickUser('test1', 'test reason');
        expect(channelEngine.size).toEqual(0);
        expect(channelEngine.getUserData('test')).not.toBeDefined();
    });

    it('should untrack presence when user is removed', () => {
        const onMessage = jest.fn();
        const { parentEngine, socket } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        const unsub = channelEngine.addUser('test1', { test: 1 }, onMessage);

        socket.subscriptions.set('test', unsub);
        channelEngine.presenceEngine.trackPresence('test1', { test: 2 });
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.presenceEngine.trackPresence('test2', { test: 2 });
        expect(channelEngine.presenceEngine.getPresence()).toEqual({
            test1: { test: 2 },
            test2: { test: 2 },
        });
        onMessage.mockClear();
        channelEngine.kickUser('test1', 'test reason');
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            test2: { test: 2 },
        });
        expect(onMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                channelName: 'test',
                event: PresenceEventTypes.LEAVE,
                action: ServerActions.PRESENCE,
                payload: {
                    presence: [{ test: 2 }],
                    changed: {
                        test: 2,
                    },
                },
            }),
        );
    });

    it('should throw error if user is not in channel and isPond is false', () => {
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        // add a user to the channel
        channelEngine.addUser('test', { test: 1 }, jest.fn());

        // track the added user's presence
        channelEngine.presenceEngine.trackPresence('test', { test: 2 });

        // we do this because we want to initialize the presence engine
        // the engine is not initialized by default when a channel is created

        expect(() => {
            // now we try to untrack the presence of a user that is not in the channel
            channelEngine.presenceEngine?.removePresence('test1');
        }).toThrow('PresenceEngine: Presence with key test1 does not exist');
    });

    it('should not throw error if user is not in channel and isPond is true', () => {
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('testChannel', parentEngine);

        // add a user to the channel
        channelEngine.addUser('test', { test: 1 }, jest.fn());

        // track the added user's presence
        channelEngine.presenceEngine.trackPresence('test', { test: 2 });

        // we do this because we want to initialize the presence engine
        // the engine is not initialized by default when a xhannel is created

        expect(() => {
            // now we try to untrack the presence of a user that is not in the channel
            channelEngine.presenceEngine?.removePresence('test');
        }).not.toThrow();
    });

    it('should be able to kick a user from the channel', () => {
        const onMessage = jest.fn();
        const { parentEngine, socket } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test1', { test: 1 }, onMessage);
        const unsub = channelEngine.addUser('test2', { test: 1 }, onMessage);

        onMessage.mockClear();
        socket.subscriptions.set('test', unsub);
        channelEngine.kickUser('test1', 'test reason');
        expect(channelEngine.size).toEqual(1);
        expect(channelEngine.getUserData('test2')).not.toBeDefined();
        expect(onMessage.mock.calls[0][0]).toStrictEqual(
            expect.objectContaining({
                action: ServerActions.SYSTEM,
                channelName: 'test',
                event: 'kicked_out',
                payload: {
                    code: 403,
                    message: 'test reason',
                },
            }),
        );

        expect(onMessage.mock.calls[1][0]).toStrictEqual(
            expect.objectContaining({
                action: ServerActions.SYSTEM,
                channelName: 'test',
                event: 'kicked',
                payload: {
                    reason: 'test reason',
                    userId: 'test1',
                },
            }),
        );

        expect(onMessage).toHaveBeenCalledTimes(2);
    });

    it('should call destroy on parent engine', () => {
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.destroy('test');
        expect(parentEngine.destroyChannel).toHaveBeenCalled();
    });

    it('should broadcast a message to all users', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();

        parentEngine.middleware.run = (_, res) => {
            // res.accept();
        };
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);

        onMessage.mockClear();
        channelEngine.sendMessage(SystemSender.CHANNEL, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, 'test', { test: 2 });

        expect(onMessage.mock.calls[0][0]).toStrictEqual(
            expect.objectContaining({
                action: ServerActions.BROADCAST,
                channelName: 'test',
                event: 'test',
                payload: {
                    test: 2,
                },
            }),
        );

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
        const { parentEngine } = createParentEngine();

        parentEngine.middleware.run = (_, res) => {
            // res.accept();
        };
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);

        onMessage.mockClear();
        channelEngine.sendMessage('test2', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'test', { test: 2 });

        expect(onMessage.mock.calls[0][0]).toStrictEqual(
            expect.objectContaining({
                action: ServerActions.BROADCAST,
                channelName: 'test',
                event: 'test',
                payload: {
                    test: 2,
                },
            }),
        );

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
        const { parentEngine } = createParentEngine();

        parentEngine.middleware.run = (_, res) => {
            // res.accept();
        };
        const channelEngine = new ChannelEngine('test', parentEngine);

        channelEngine.addUser('test', { test: 1 }, onMessage);
        channelEngine.addUser('test2', { test: 1 }, onMessage);
        channelEngine.addUser('test3', { test: 1 }, onMessage);

        onMessage.mockClear();
        channelEngine.sendMessage('test2', ['test', 'test3'], ServerActions.BROADCAST, 'test', { test: 2 });

        expect(onMessage.mock.calls[0][0]).toStrictEqual(
            expect.objectContaining({
                action: ServerActions.BROADCAST,
                channelName: 'test',
                event: 'test',
                payload: {
                    test: 2,
                },
            }),
        );

        expect(onMessage.mock.calls[1][0]).toStrictEqual(
            expect.objectContaining({
                action: ServerActions.BROADCAST,
                channelName: 'test',
                event: 'test',
                payload: {
                    test: 2,
                },
            }),
        );

        expect(onMessage).toHaveBeenCalledTimes(2);

        // when recipient is not in channel it throws an error
        expect(() => {
            channelEngine.sendMessage('test3', ['test', 'test3', 'test4'], ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: Invalid recipients test,test3,test4 some users do not exist in channel test');

        // when sender is not in channel it throws an error
        expect(() => {
            channelEngine.sendMessage('test4', ['test', 'test3'], ServerActions.BROADCAST, 'test', { test: 3 });
        }).toThrow('ChannelEngine: User with id test4 does not exist in channel test');
    });

    it('should broadcast messages while also triggering the onMessage callback', () => {
        const onMessage = jest.fn();
        const { parentEngine } = createParentEngine();
        const channelEngine = new ChannelEngine('test', parentEngine);

        parentEngine.middleware.run = (req: EventRequest<string>, res: EventResponse) => {
            expect(req).toBeInstanceOf(EventRequest);
            expect(res).toBeInstanceOf(EventResponse);
        };

        expect(() => channelEngine.broadcastMessage('test2', {
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: { test: 1 },
            requestId: uuid(),
        })).toThrow('ChannelEngine: User with id test2 does not exist in channel test');

        channelEngine.addUser('test2', { test: 1 }, onMessage);

        onMessage.mockClear();
        channelEngine.broadcastMessage('test2', {
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: { test: 1 },
            requestId: uuid(),
        });

        // This is because the message didn't perform any sort of broadcast
        expect(onMessage).toHaveBeenCalledTimes(0);

        let count = 0;

        onMessage.mockClear();
        parentEngine.middleware.run = (req: EventRequest<string>, res: EventResponse, next: any) => {
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
            requestId: uuid(),
        });

        // proves that the message was received by the parent engine
        expect(count).toBe(1);

        // however the onMessage callback was not called
        // because the message was never handled by the parent engine
        expect(onMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: ServerActions.ERROR,
                channelName: 'test',
                event: ErrorTypes.HANDLER_NOT_FOUND,
                payload: {
                    code: 404,
                    message: 'A handler did not respond to the event',
                },
            }),
        );
    });
});
