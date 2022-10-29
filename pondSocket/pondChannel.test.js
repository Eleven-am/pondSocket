"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pondChannel_1 = require("./pondChannel");
const channel_test_1 = require("./channel.test");
const enums_1 = require("./enums");
const channel_1 = require("./channel");
const pondBase_1 = require("../pondBase");
const createPondChannel = (path, handler) => {
    path = path || "/pond";
    handler = handler || jest.fn();
    return new pondChannel_1.PondChannel(path, handler);
};
describe('PondChannel', () => {
    it('should exists', () => {
        expect(pondChannel_1.PondChannel).toBeDefined();
    });
    it('should be a class', () => {
        expect(pondChannel_1.PondChannel).toBeInstanceOf(Function);
    });
    it('should be able to get the info of a channel', () => {
        const pondChannel = createPondChannel();
        const { channel } = (0, channel_test_1.createChannel)('/channel');
        // Because we want to get the info of the channel, we need to add it to the pondChannel
        // for testing purposes
        pondChannel['_channels'].set(channel.name, channel);
        expect(pondChannel.info).toEqual([channel.info]);
    });
    it('should be able ot add a user', () => {
        const pondChannel = createPondChannel('/test');
        expect(() => pondChannel.getChannelInfo('/test')).toThrow(); // This throws an error because the channel does not exist anymore
        const testUser = {
            clientId: 'test', assigns: {}, socket: {
                send: jest.fn(), on: jest.fn(),
            }
        };
        pondChannel.addUser(testUser, '/balls', {}); // When joining a channel the channel name must be matchable by the PondPath
        // /balls !== /test so we expect an error message to be sent to the client from the pond channel
        expect(testUser.socket.send).toBeCalledWith(JSON.stringify({
            action: enums_1.ServerActions.ERROR, event: "JOIN_REQUEST_ERROR", channelName: enums_1.PondSenders.POND_CHANNEL, payload: {
                message: `Invalid channel name: /balls`, code: 403,
            }
        }));
        expect(pondChannel.getChannel('/test')).toBeNull(); // The channel does not exist yet
        expect(() => pondChannel.addUser(testUser, '/test', {}))
            .toThrow(); // handler function does not act on the incoming connection, it is just a jest mock function
        // /test === /test so we expect the user to be added to the channel
        // if the channel does not exist, it will be created
        expect(pondChannel.getChannel('/test')).toBeNull(); // The channel does not exist yet
        const newPondChannel = new pondChannel_1.PondChannel('/test', (_, res) => {
            res.accept(); // here we accept the connection
        });
        newPondChannel.addUser(testUser, '/test', {});
        expect(newPondChannel.getChannel('/test')).not.toBeNull(); // The channel does exist now
        const newChannel = newPondChannel.getChannel('/test');
        expect(newChannel).toBeDefined();
        expect(newChannel).toBeInstanceOf(channel_1.Channel);
        expect(newChannel === null || newChannel === void 0 ? void 0 : newChannel.name).toBe('/test');
        const rejectPondChannel = new pondChannel_1.PondChannel('/:test', (req, res) => {
            if (req.params.test === 'balls')
                res.reject(); // here we reject the connection
            else if (req.params.test === 'rejectWithMessage')
                res.reject('test', 69420); // here we reject the connection with a message and a status code
        });
        testUser.socket.send.mockClear(); // Clear the mock function
        rejectPondChannel.addUser(testUser, '/rejectWithMessage', {});
        expect(rejectPondChannel.getChannel('/rejectWithMessage')).toBeNull(); // The channel does not exist as it rejects the connection and deletes itself
        expect(testUser.socket.send).toBeCalledWith(JSON.stringify({
            action: enums_1.ServerActions.ERROR, event: "JOIN_REQUEST_ERROR", channelName: enums_1.PondSenders.POND_CHANNEL, payload: {
                message: `test`, code: 69420,
            }
        }));
        rejectPondChannel.addUser(testUser, '/balls', {});
        expect(rejectPondChannel.getChannel('/balls')).toBeNull(); // The channel does not exist as it rejects the connection and deletes itself
        expect(testUser.socket.send).toBeCalledWith(JSON.stringify({
            action: enums_1.ServerActions.ERROR, event: "JOIN_REQUEST_ERROR", channelName: enums_1.PondSenders.POND_CHANNEL, payload: {
                message: `Unauthorized join request`, code: 403,
            }
        }));
        const acceptPondChannel = new pondChannel_1.PondChannel('/:test', (_, res) => {
            res.send('test', {
                test: 'test'
            }); // here we send a message after accepting the connection
        });
        testUser.socket.send.mockClear(); // Clear the mock function
        const messages = [];
        testUser.socket.send = (message) => {
            messages.push(JSON.parse(message));
        };
        acceptPondChannel.addUser(testUser, '/test', {});
        expect(messages).toEqual([{
                action: enums_1.ServerActions.PRESENCE, event: pondBase_1.PondBaseActions.ADD_TO_POND, channelName: '/test', payload: {
                    presence: [{ id: 'test' }], change: { id: 'test' }
                }
            }, {
                action: enums_1.ServerActions.MESSAGE, event: "test", channelName: '/test', payload: {
                    test: 'test'
                }
            }]);
    });
    it('should be able to receive subscriptions', () => {
        const pond = new pondChannel_1.PondChannel('/:test', (_, res) => {
            res.accept();
        });
        //when events are added, they are added sequentially
        // this means the first handler is called first, and the second handler is called second...
        // so if a regex handler should be added last so everything else can be tried first
        let narrowedMessageCount = 0;
        pond.on('event:test', (req, res) => {
            narrowedMessageCount++;
            if (req.params.test === 'balls')
                expect(() => res.reject()).toThrow(); // this would throw an error because the sender is the pond channel itself
            // we know this because we wrote the test that way, to confirm who the sender is you can check the req.client property
            else if (req.params.test === 'rejectWithMessage')
                res.reject('test', 69420); // here we reject the connection with a message and a status code
            else if (req.params.test === 'accept')
                res.accept();
            else if (req.params.test === 'send')
                res.send('test', {
                    test: 'test'
                });
            else if (req.params.test === 'acceptWithPresence')
                res.accept({
                    presence: {
                        status: 'online'
                    }
                });
            else if (req.params.test === 'acceptWithAssigns')
                res.accept({
                    assigns: {
                        test: 'test'
                    }
                });
            else if (req.params.test === 'acceptWithChannelData')
                res.accept({
                    channelData: {
                        test: 'test'
                    }
                });
            else if (req.params.test === 'acceptWithAll')
                res.accept({
                    presence: {
                        status: 'offline'
                    },
                    assigns: {
                        test: 'test'
                    },
                    channelData: {
                        test: 'test2'
                    }
                });
        });
        let encompassingMessageCount = 0;
        pond.on(/(.*?)/, (req, res) => {
            console.log(req.event);
            expect(req.params).toEqual({});
            // with all encompassing regex, the params should be empty
            // also if there are no other matching handlers, they would be called
            // hey can be used for loggers or actions that should be done on all events
            encompassingMessageCount++;
            res.send('fallback', {
                message: 'This is a fallback route'
            });
        });
        let userMessageCount = 0;
        const sender = () => {
            userMessageCount++;
        };
        // we add two users to the pond on ethe channel /pond
        pond.addUser({
            clientId: 'test1',
            assigns: {},
            socket: {
                send: sender,
                on: jest.fn(),
            }
        }, '/pond', {});
        pond.addUser({
            clientId: 'test2',
            assigns: {},
            socket: {
                send: sender,
                on: jest.fn(),
            }
        }, '/pond', {});
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {},
            presence: [{
                    id: 'test1',
                }, {
                    id: 'test2',
                }],
            assigns: [{}, {}],
        });
        expect(encompassingMessageCount).toBe(0); // The on function is only called when a message is sent
        expect(userMessageCount).toBe(3); // first user gets their join event and the seconds join,
        encompassingMessageCount = 0;
        userMessageCount = 0;
        pond.broadcastToChannel('/pond', 'eventballs', {
            test: 'test'
        }); // When we broadcast to a channel, the pondChannel itself is the sender of the message
        // so if we try to act on the connection, it would throw an error as there is no one to send the rejection to
        // act on the connection = accept, reject, send
        expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the broadcast event is not caught by the encompassing handler
        expect(userMessageCount).toBe(0); // because the :test param is balls which was rejected by the handler, the message is not sent to the client
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        const channel = pond.getChannel('/pond');
        expect(channel).toBeInstanceOf(channel_1.Channel);
        expect(channel).not.toBeNull();
        // since the PondChannel has no way to send messages on behalf of a client we get the channel from the pond and send the message directly to the channel
        channel === null || channel === void 0 ? void 0 : channel.broadcast('eventrejectWithMessage', {}, 'test1'); // here we broadcast to the channel, but we specify the sender as test1
        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the send event is not caught by the encompassing handler
        expect(userMessageCount).toBe(1); // because the :test param is rejectWithMessage which was rejected by the handler with a message, the message is not sent to the client
        // a rejection message should be sent back to the emitter of the event in this case, the user test1
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        channel === null || channel === void 0 ? void 0 : channel.broadcast('eventaccept', {
            test: 'test'
        });
        expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the broadcast event is not caught by the encompassing handler
        expect(userMessageCount).toBe(2); // because the :test param = accept which was accepted by the handler, the message is sent to the client
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        channel === null || channel === void 0 ? void 0 : channel.broadcast('eventsend', {
            test: 'test'
        }, 'test2'); // the message is sent on behalf of test2
        expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // messages sent in the handlers are sent directly to the client and are not considered broadcasts
        expect(userMessageCount).toBe(3); // since we broadcast a message to all users = 2 we have 2 messages + the message sent to test2 from the narrowed handler
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        channel === null || channel === void 0 ? void 0 : channel.sendTo('eventacceptWithPresence', {
            test: 'test'
        }, 'test2', 'test1');
        expect(narrowedMessageCount).toBe(1); // the event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the event is not caught by the encompassing handler because a response has already been sent
        expect(userMessageCount).toBe(3); // the message is sent since it was accepted in the handler
        // the user's presence is modified and sent to all users 1 message + 2 presence update messages
        // however we have also modified the presence of the sender
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {},
            presence: [{
                    id: 'test1',
                }, {
                    id: 'test2',
                    status: 'online'
                }],
            assigns: [{}, {}],
        });
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        channel === null || channel === void 0 ? void 0 : channel.sendTo('eventacceptWithChannelData', {
            test: 'test'
        }, 'test2', 'test1');
        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the (send) message does not modify the user presence, which is not caught by the encompassing handler
        expect(userMessageCount).toBe(1); // the message is sent since it was accepted in the handler
        // however we have also modified the channel data
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: { test: 'test' },
            presence: [{
                    id: 'test1',
                }, {
                    id: 'test2',
                    status: 'online'
                }],
            assigns: [{}, {}],
        });
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        channel === null || channel === void 0 ? void 0 : channel.sendTo('eventacceptWithAssigns', {
            test: 'test',
        }, 'test2', 'test1');
        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the (send) message does not modify the user presence, which is not caught by the encompassing handler
        expect(userMessageCount).toBe(1); // the message is sent since it was accepted in the handler
        // however we have also modified the assigns
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: { test: 'test' },
            presence: [{
                    id: 'test1',
                }, {
                    id: 'test2',
                    status: 'online'
                }],
            assigns: [{}, { test: 'test' }],
        });
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        pond.modifyPresence('/pond', 'test2', {
            presence: {}
        });
        // No messages are sent because the presence is not modified
        expect(narrowedMessageCount).toBe(0);
        expect(encompassingMessageCount).toBe(0);
        expect(userMessageCount).toBe(0);
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: { test: 'test' },
            presence: [{
                    id: 'test1',
                }, {
                    id: 'test2',
                    status: 'online'
                }],
            assigns: [{}, { test: 'test' }],
        });
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        pond.closeFromChannel('/pond', 'test2');
        // since a user has left the channel a message is sent to all users
        expect(narrowedMessageCount).toBe(0); // The on handler does not listen to presence change events
        expect(encompassingMessageCount).toBe(0); // The on handler does not listen to presence change events
        expect(userMessageCount).toBe(1); //only the user left in the channel receives the presence change message
        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: { test: 'test' },
            presence: [{
                    id: 'test1',
                }],
            assigns: [{}],
        });
    });
    it('should be capable of removing a user from a channel', () => {
        const pond = new pondChannel_1.PondChannel('/test', (_, res) => {
            res.accept(); // here we accept the connection
        });
        let userMessageCount = 0;
        const sender = () => {
            userMessageCount++;
        };
        pond.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send: sender,
                on: jest.fn(),
            }
        }, '/test', {});
        pond.addUser({
            clientId: 'test2',
            assigns: {},
            socket: {
                send: sender,
                on: jest.fn(),
            }
        }, '/test', {});
        pond.addUser({
            clientId: 'test3',
            assigns: {},
            socket: {
                send: sender,
                on: jest.fn(),
            }
        }, '/test', {});
        expect(pond.info).toHaveLength(1);
        expect(pond.getChannelInfo('/test')).toEqual({
            name: '/test',
            channelData: {},
            presence: [{
                    id: 'test',
                }, {
                    id: 'test2',
                }, {
                    id: 'test3',
                }],
            assigns: [{}, {}, {}],
        });
        expect(pond['_subscriptions']['test']).toHaveLength(1); // the subscription holds all subscriptions a user has in multiple channels
        pond.modifyPresence('/test', 'test', {
            assigns: {
                name: 'test'
            }
        });
        expect(pond.getChannelInfo('/test')).toEqual({
            name: '/test',
            channelData: {},
            presence: [{
                    id: 'test',
                }, {
                    id: 'test2',
                }, {
                    id: 'test3',
                }],
            assigns: [{
                    name: 'test'
                }, {}, {}]
        });
        userMessageCount = 0;
        pond.send('/test', ['test', 'test2', 'test3'], 'test', {
            test: 'test'
        });
        expect(userMessageCount).toBe(3);
        // when you remove a user from a pond channel the user is removed from the pond channel and all the channels within the pond
        pond.removeUser('test');
        expect(pond['_subscriptions']['test']).toBeUndefined();
        expect(pond.info).toHaveLength(1);
        pond.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send: sender,
                on: jest.fn(),
            }
        }, '/test', {});
        expect(pond['_subscriptions']['test']).toHaveLength(1); // the subscription holds all subscriptions a user has in multiple channels
        pond['_removeSubscriptions'](['test', 'test2', 'test3'], '/test');
        expect(pond['_subscriptions']['test']).toHaveLength(0); // the subscription is empty but the user is still in the channel and pond
        expect(pond.info).toHaveLength(1); // since the user is still in the channel the pond is still active with the channel
        // it should be noted that while the user has unsubscribed they are still in the channel, they would not receive any messages
    });
});
