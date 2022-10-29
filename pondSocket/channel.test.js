"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChannel = void 0;
const channel_1 = require("./channel");
const channelMiddleWare_1 = require("./channelMiddleWare");
const pondBase_1 = require("../pondBase");
const enums_1 = require("./enums");
const createChannel = (name) => {
    const user = {
        client: {
            clientId: 'test',
            socket: {
                send: jest.fn(),
                on: jest.fn(),
            }
        },
        presence: {
            status: 'online',
            lastSeenDate: new Date(),
        },
        assigns: {},
        channelData: {}
    };
    const removeDoc = jest.fn();
    const middleware = new channelMiddleWare_1.ChannelMiddleware();
    const channel = new channel_1.Channel(name, middleware, removeDoc);
    return { channel, removeDoc, user };
};
exports.createChannel = createChannel;
describe('Channel', () => {
    it('should exist', () => {
        expect(channel_1.Channel).toBeDefined();
    });
    it('should be a class', () => {
        expect(channel_1.Channel).toBeInstanceOf(Function);
    });
    // Functionality tests
    it('should add a user to the channel', () => {
        const lastSeenDate = new Date();
        const { channel } = (0, exports.createChannel)('test');
        const user = {
            client: {
                clientId: 'test',
                socket: {
                    send: jest.fn(),
                    on: jest.fn(),
                }
            },
            presence: {
                status: 'online',
                lastSeen: lastSeenDate
            },
            assigns: {},
            channelData: {}
        };
        channel.addUser(user);
        expect(channel.getUserInfo('test')).toEqual({
            presence: {
                id: 'test',
                status: 'online',
                lastSeen: lastSeenDate
            },
            assigns: {},
        });
    });
    it('should remove a user from the channel', () => {
        const lastSeenDate = new Date();
        const { channel, user } = (0, exports.createChannel)('test');
        user.presence.lastSeenDate = lastSeenDate;
        channel.addUser(user);
        channel.removeUser('test');
        expect(channel.getUserInfo('test')).toBeNull();
    });
    it('should update a user in the channel', () => {
        const lastSeenDate = new Date();
        const { channel, user } = (0, exports.createChannel)('test');
        user.presence.lastSeenDate = lastSeenDate;
        channel.addUser(user);
        expect(channel.getUserInfo('test')).toEqual({
            presence: {
                id: 'test',
                status: 'online',
                lastSeenDate: lastSeenDate
            },
            assigns: {},
        });
        // replace both presence and assigns
        channel.updateUser('test', {
            status: 'offline'
        }, {
            test: 'test'
        });
        expect(channel.getUserInfo('test')).toEqual({
            presence: {
                id: 'test',
                status: 'offline',
                lastSeenDate: lastSeenDate
            },
            assigns: {
                test: 'test'
            },
        });
        // replace only presence
        channel.updateUser('test', {
            status: 'online'
        }, {});
        expect(channel.getUserInfo('test')).toEqual({
            presence: {
                id: 'test',
                status: 'online',
                lastSeenDate: lastSeenDate
            },
            assigns: {
                test: 'test'
            },
        });
        // replace only assigns
        channel.updateUser('test', {}, {
            test: 'test2'
        });
        expect(channel.getUserInfo('test')).toEqual({
            presence: {
                id: 'test',
                status: 'online',
                lastSeenDate: lastSeenDate
            },
            assigns: {
                test: 'test2'
            },
        });
    });
    it('should throw when you add a user with an existing id', () => {
        const lastSeenDate = new Date();
        const { channel, user } = (0, exports.createChannel)('test');
        user.presence.lastSeenDate = lastSeenDate;
        channel.addUser(user);
        expect(() => channel.addUser(user)).toThrow();
    });
    it('should broadcast a message when a user is added', () => {
        const lastSeenDate = new Date();
        const { channel, user } = (0, exports.createChannel)('test');
        user.presence.lastSeenDate = lastSeenDate.toString();
        const messages = [];
        channel.onPresenceChange((message) => {
            messages.push(message.event);
        });
        channel.addUser(user);
        channel.removeUser('test'); // this broadcast will not be received by the subscription as it unsubscribes after the first message
        expect(channel.getUserInfo('test')).toBeNull();
        expect(messages).toHaveLength(2);
        expect(messages).toEqual([pondBase_1.PondBaseActions.ADD_TO_POND, pondBase_1.PondBaseActions.REMOVE_FROM_POND]);
    });
    it('should set and get the channel data', () => {
        const { channel } = (0, exports.createChannel)('test');
        channel.data = {
            test: 'test'
        };
        expect(channel.data).toStrictEqual({
            test: 'test'
        });
    });
    it('should get channel info', () => {
        const { channel } = (0, exports.createChannel)('test');
        channel.addUser({
            client: {
                clientId: 'test1',
            },
            presence: { status: 'online' },
            assigns: {},
            channelData: { name: 'test1' }
        });
        expect(channel.info).toStrictEqual({
            name: 'test',
            presence: [
                {
                    id: 'test1',
                    status: 'online',
                }
            ],
            assigns: [{}],
            channelData: {
                name: 'test1'
            }
        });
        channel.data = {
            test: 'test'
        };
        expect(channel.info).toStrictEqual({
            name: 'test',
            presence: [
                {
                    id: 'test1',
                    status: 'online',
                }
            ],
            assigns: [{}],
            channelData: {
                name: 'test1',
                test: 'test'
            }
        });
    });
    it('should get the presence of all the users in the class', () => {
        const { channel } = (0, exports.createChannel)('test');
        expect(channel.presence).toStrictEqual([]);
        channel.addUser({
            client: {
                clientId: 'test1',
            },
            presence: { status: 'online' },
            assigns: {},
            channelData: { name: 'test1' }
        });
        expect(channel.presence).toStrictEqual([
            {
                id: 'test1',
                status: 'online',
            }
        ]);
    });
    it('should be possible to remove multiple users at once', () => {
        const { channel, user } = (0, exports.createChannel)('test');
        const user1 = Object.assign({}, user);
        user1.client.clientId = 'test1';
        channel.addUser(user1);
        const user2 = Object.assign({}, user);
        user2.client.clientId = 'test2';
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        channel.removeUser(['test1', 'test2']);
        expect(channel.info.presence.length).toBe(0);
    });
    it('should broadcast a message to all users in the channel except the sender', () => {
        const { channel } = (0, exports.createChannel)('test');
        let addresses = [];
        // mock of a socket connection subscribed to the channel
        // in a real world scenario, addresses.push = socket.send
        // _message is the message to be JSON.stringified and sent to the socket
        const sub = channel.subscribeToMessages('test1', (_message) => {
            addresses.push('test1');
        });
        const user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        const user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        // we add the listener first to make sure that the user gets updates on their own join
        channel.addUser(user1);
        // unlike a normal subscription, this subscription will receive messages when the channel's presence is updated
        // this is useful for the client to know when a user joins / leaves the channel
        // This subscribers cannot block the channel from broadcasting messages
        const sub2 = channel.subscribeToMessages('test2', () => {
            addresses.push('test2');
        });
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        expect(addresses.length).toBe(3); // 3 joins messages because the first user receives the join message from the second user as well as their own
        addresses = [];
        channel.broadcastFrom('testEvent', { test: 'test' }, 'test1');
        expect(addresses.length).toBe(1);
        expect(addresses[0]).toBe('test2'); // the message was sent to the second user only: test1
        // when your broadcastFrom is called with a user that is not in the channel,
        // An error will be thrown
        expect(() => {
            channel.broadcastFrom('testEvent', { test: 'test' }, 'test3');
        }).toThrowError(`Client with clientId test3 does not exist in channel test`);
        // when your broadcast is called with a user that is not in the channel,
        // An error will be thrown
        expect(() => {
            channel.broadcast('testEvent', { test: 'test' }, 'test3');
        }).toThrowError(`Client with clientId test3 does not exist in channel test`);
        sub.unsubscribe();
        sub2.unsubscribe();
    });
    it('should provide an onMessage callback', () => {
        const { channel } = (0, exports.createChannel)('test');
        const messages = [];
        channel.onMessage((message) => {
            messages.push(message.event);
        });
        expect(() => channel.broadcast('testEvent', { test: 'test' }, 'test1')).toThrow();
        expect(messages).toHaveLength(0);
    });
    it('should be able to hook up to the onMessage callback', () => {
        const { channel, user } = (0, exports.createChannel)('test');
        const messages = [];
        channel.addUser(user);
        channel.onMessage((req, res) => {
            expect(req.client.clientId).toEqual(enums_1.PondSenders.POND_CHANNEL);
            if (req.event === 'testEvent') {
                messages.push(req.event);
                res.send('test', { test: 'test' });
            }
        });
        channel.subscribeToMessages('test1', (message) => {
            messages.push(message.event);
        });
        expect(() => channel.broadcast('testEvent', { test: 'test' })).toThrow(); // the handler always replies to a testEvent message
        // since the sender is the channel itself, the send function throws an error
        expect(messages).toHaveLength(1);
        expect(messages).toEqual(['testEvent']); // this is because the broadcaster is the channel itself
    });
    it('should be able to hook up to the onMessage callback and send a message to the sender', () => {
        const { channel, user } = (0, exports.createChannel)('test');
        const messages = [];
        channel.addUser(user);
        channel.onMessage((req, res) => {
            expect(req.client.clientId).toEqual('test');
            if (req.event === 'testEvent')
                res.send('test', { test: 'test' });
        });
        channel.subscribeToMessages('test', (message) => {
            messages.push(message.event);
        });
        channel.broadcast('testEvent', { test: 'test' }, 'test');
        expect(messages).toHaveLength(2);
        expect(messages).toEqual(['test', 'testEvent']); // this is because the broadcast is made on behalf of the user
        // the message sent in the handler always gets to the user before the message sent by the broadcaster
    });
    it('should not call further onMessage callbacks if the callback rejects', (done) => {
        const { channel, user } = (0, exports.createChannel)('test');
        let messages = [];
        channel.addUser(user);
        channel.onMessage((req, res) => {
            if (req.event === 'testEvent')
                return;
            messages.push(req.event);
            res.reject('error message', 213);
        });
        channel.onMessage((req, res) => {
            if (req.event === 'testEvent') {
                messages.push(req.event);
                res.send('test', { test: 'onMessage' });
            }
        });
        channel.subscribeToMessages('test', (message) => {
            messages.push(message.event);
        });
        channel.sendTo('test', { test: 'test' }, 'test', ['test']);
        expect(messages).toHaveLength(2);
        // The first callback rejects the message, so the second callback is never called
        // The user does not receive the message either because the message was rejected
        // however, the user does receive the rejection message so
        // 1 rejection callback receives the message + 1 rejection message
        expect(messages).toEqual(['test', 'error']);
        messages = [];
        channel.sendTo('testEvent', { test: 'broadcast' }, 'test', ['test']);
        // The first callback does not reject the message, so the second callback is called
        // The user receives the message because the message was not rejected
        // however, the user also receives a second message because the second callback sends a message as well
        // 1 on message callback , 1 initial message, 1 message from the callback
        setTimeout(() => {
            expect(messages).toHaveLength(3); // Sometimes because of the async nature of the tests, the messages are not received in the correct order
            expect(messages).toEqual(['testEvent', 'test', 'testEvent']);
            done();
        }, 10);
        // when sendTo is called for a user that is not in the channel,
        // An error will be thrown
        expect(() => {
            channel.sendTo('testEvent', { test: 'test' }, 'test3', ['test']);
        }).toThrow();
        expect(() => {
            channel.sendTo('testEvent', { test: 'test' }, 'test', ['test3']);
        }).toThrow();
    });
});
