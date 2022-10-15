"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = require("./channel");
var enums_1 = require("./enums");
var pondbase_1 = require("../pondbase");
describe('Channel', function () {
    it('should exist', function () {
        expect(channel_1.Channel).toBeDefined();
    });
    it('should be a class', function () {
        expect(channel_1.Channel).toBeInstanceOf(Function);
    });
    it('should have a addUser method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('addUser');
    });
    it('should have a removeUser method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('removeUser');
    });
    it('should have a getUserInfo method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('getUserInfo');
    });
    it('should have a updateUser method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('updateUser');
    });
    it('should have a broadcast method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('broadcast');
    });
    it('should have a broadcastFrom method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('broadcastFrom');
    });
    it('should have a sendTo method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('sendTo');
    });
    it('should have a _sendToClients method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('_sendToClients');
    });
    it('should have a subscribe method', function () {
        expect(new channel_1.Channel('test', function () {
        })).toHaveProperty('subscribe');
    });
    // Functionality tests
    it('should add a user to the channel', function () {
        var lastSeenDate = new Date();
        var channel = new channel_1.Channel('test', function () {
        });
        var user = {
            client: {
                clientId: 'test',
                socket: {
                    send: function () {
                    },
                    on: function () {
                    }
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
    it('should send error to user if addUser is called with an existing user', function () {
        var channel = new channel_1.Channel('test', function () {
        });
        var user = {
            client: {
                clientId: 'test'
            },
            presence: {
                status: 'online',
                lastSeen: new Date()
            },
            assigns: {},
            channelData: {}
        };
        channel.addUser(user);
        expect(function () { return channel.addUser(user); }).toThrowError(pondbase_1.PondError);
    });
    it('should remove a user from the channel', function () {
        var lastSeenDate = new Date();
        var channel = new channel_1.Channel('test', function () {
        });
        var user = {
            client: {
                clientId: 'test',
                socket: {
                    send: function () {
                    },
                    on: function () {
                    }
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
        channel.removeUser('test');
        expect(channel.getUserInfo('test')).toBeNull();
    });
    it('should update a user in the channel', function () {
        var lastSeenDate = new Date();
        var channel = new channel_1.Channel('test', function () {
        });
        var user = {
            client: {
                clientId: 'test',
                socket: {
                    send: function () {
                    },
                    on: function () {
                    }
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
                lastSeen: lastSeenDate
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
                lastSeen: lastSeenDate
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
                lastSeen: lastSeenDate
            },
            assigns: {
                test: 'test2'
            },
        });
    });
    it('should broadcast a message when a user is added', function (done) {
        var lastSeenDate = new Date();
        var channel = new channel_1.Channel('test', function () {
        });
        var subscription = channel.subscribe(function (message) {
            var expectedMessage = {
                action: enums_1.ServerActions.PRESENCE,
                event: 'JOIN_CHANNEL',
                channelName: 'test',
                clientId: enums_1.PondSenders.POND_CHANNEL,
                clientPresence: {
                    id: 'test',
                    status: 'online',
                    lastSeen: lastSeenDate.toString()
                },
                clientAssigns: {},
                channel: channel,
                payload: {
                    presence: [{
                            id: 'test',
                            status: 'online',
                            lastSeen: lastSeenDate.toString()
                        }],
                    change: {
                        id: 'test',
                        status: 'online',
                        lastSeen: lastSeenDate.toString()
                    }
                }
            };
            expect(message).toEqual(expectedMessage);
            subscription.unsubscribe();
            done();
        });
        var user = {
            client: {
                clientId: 'test',
            },
            presence: {
                status: 'online',
                lastSeen: lastSeenDate.toString()
            },
            assigns: {},
            channelData: {}
        };
        channel.addUser(user);
        channel.removeUser('test'); // this broadcast will not be received by the subscription as it unsubscribes after the first message
        expect(channel.getUserInfo('test')).toBeNull();
    });
    it('should broadcast to all users when a user presence is added / updated / removed', function () {
        var joins = 0;
        var updates = 0;
        var channel = new channel_1.Channel('test', function () {
        });
        var sub = channel.subscribe(function (data) {
            if (data.action === enums_1.ServerActions.PRESENCE) {
                if (data.event === 'JOIN_CHANNEL')
                    joins++;
                else if (data.event === 'LEAVE_CHANNEL')
                    joins--;
                else
                    updates++;
            }
        });
        var user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var user3 = {
            client: {
                clientId: 'test3',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        channel.addUser(user1);
        channel.addUser(user2);
        channel.addUser(user3);
        expect(joins).toBe(3); // 3 users joined
        expect(updates).toBe(0); // no updates yet
        channel.removeUser('test1');
        expect(joins).toBe(2); // 1 user left, 1 message sent
        channel.updateUser('test2', {
            status: 'online'
        }, {
            test: 'test'
        });
        expect(updates).toBe(1); // 1 update sent
        sub.unsubscribe();
        channel.updateUser('test2', {
            status: 'online'
        }, {
            test: 'test'
        });
        expect(updates).toBe(1); // 1 - no new updates as the subscription is unsubscribed
    });
    it('should set and get the channel data', function () {
        var channel = new channel_1.Channel('test', function () {
        });
        channel.data = {
            test: 'test'
        };
        expect(channel.data).toStrictEqual({
            test: 'test'
        });
    });
    it('should get channel info', function () {
        var channel = new channel_1.Channel('test', function () {
        });
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
            assigns: {
                test1: {}
            },
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
            assigns: {
                test1: {}
            },
            channelData: {
                name: 'test1',
                test: 'test'
            }
        });
    });
    it('should be possible to remove multiple users at once', function () {
        var channel = new channel_1.Channel('test', function () { });
        var user1 = {
            client: {
                clientId: 'test1',
                socket: {
                    send: function () { },
                    on: function () { }
                }
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var user2 = {
            client: {
                clientId: 'test2',
                socket: {
                    send: function () { },
                    on: function () { }
                }
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        channel.addUser(user1);
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        channel.removeUser(['test1', 'test2']);
        expect(channel.info.presence.length).toBe(0);
    });
    it('should broadcast a message to all users in the channel', function () {
        var channel = new channel_1.Channel('test', function () { });
        var receivedMessages = [];
        var sub = channel.subscribe(function (message) {
            receivedMessages.push(message);
        });
        var user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        channel.addUser(user1);
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        expect(receivedMessages.length).toBe(2); //  1 join message for each user
        receivedMessages = [];
        channel.broadcast('testEvent', { test: 'test' });
        expect(receivedMessages.length).toBe(1);
        sub.unsubscribe();
    });
    it('should broadcast a message to all users in the channel except the sender', function () {
        var channel = new channel_1.Channel('test', function () { });
        var addresses = [];
        var user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var sub = channel.subscribeToMessages('test1', function (_) {
            addresses.push('test1');
        });
        var user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        //we add the listener first to make sure that the user gets updates on their own join
        channel.addUser(user1);
        //unlike a normal subscription, this subscription will receive messages when the channel's presence is updated
        var sub2 = channel.subscribeToMessages('test2', function (_) {
            addresses.push('test2');
        });
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        expect(addresses.length).toBe(3); // 3 joins messages because the first user recieves the join message from the second user as well as their own
        addresses = [];
        channel.broadcastFrom('testEvent', { test: 'test' }, 'test1');
        expect(addresses.length).toBe(1);
        sub.unsubscribe();
        sub2.unsubscribe();
    });
    it('should interrupt broadcast if a subscriber returns a PondError', function () {
        var channel = new channel_1.Channel('test', function () { });
        var receivedMessages = [];
        channel.subscribe(function (event) {
            if (event.event === 'testEvent' && event.clientId === 'test1')
                return new pondbase_1.PondError('test', 500, {
                    event: 'testEvent',
                    channelName: 'test'
                });
            receivedMessages.push(event);
        });
        var user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        channel.addUser(user1);
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        expect(receivedMessages.length).toBe(2); //  1 join message for each user
        // the sockets themselves are not subscribed to this pubSub as it is possible for an external actor to interrupt a broadcast
        // seeing as this is vital information, we need to make sure that all users gets the message even though external subscribers can interrupt a broadcast
        // the users are thus subscribed to the pubSub directly and not through the channel's subscribe method
        receivedMessages = [];
        expect(function () { return channel.broadcast('testEvent', { test: 'test' }, 'test1'); }).toThrow(pondbase_1.PondError);
        // when a subscriber interrupts the broadcast, the message is not sent to the user that sent the message and an error is thrown
        expect(receivedMessages.length).toBe(0); // since the subscriber returned a PondError, No message was sent
        // in this case when it's messages being sent the users get the messages only after external actors do. this way the users can be sure that the message was sent
        // if an external actor interrupts the broadcast, the users will not get the message
        receivedMessages = [];
        channel.broadcast('testEvent', { test: 'test' });
        expect(receivedMessages.length).toBe(1); // A message is sent to all users
        receivedMessages = [];
        expect(function () { return channel.broadcastFrom('testEvent', { test: 'test' }, 'test1'); }).toThrowError(pondbase_1.PondError);
        expect(receivedMessages.length).toBe(0); // since the subscriber returned a PondError, the broadcast should be interrupted
        receivedMessages = [];
        channel.broadcastFrom('testEvent', { test: 'test' }, 'test2');
        expect(receivedMessages.length).toBe(1);
        receivedMessages = [];
        // when you attempt to broadcastFrom a user that doesn't exist, it should throw an error
        expect(function () { return channel.broadcastFrom('testEvent', { test: 'test' }, 'test3'); }).toThrowError();
        receivedMessages = [];
        // when you attempt to broadcast with a user that doesn't exist, it should throw an error
        expect(function () { return channel.broadcast('testEvent', { test: 'test' }, 'test3'); }).toThrowError();
    });
    it('should send messages to a specific user | users', function () {
        var channel = new channel_1.Channel('test', function () { });
        var message1 = 0;
        var message2 = 0;
        var user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        };
        var sub1 = channel.subscribeToMessages('test1', function (_) {
            message1++;
        });
        channel.addUser(user1);
        var sub2 = channel.subscribeToMessages('test2', function (_) {
            message2++;
        });
        channel.addUser(user2);
        expect(channel.info.presence.length).toBe(2);
        expect(message1 + message2).toBe(3); // 3 joins
        message1 = 0;
        message2 = 0;
        channel.sendTo('testEvent', { test: 'test' }, 'test1', 'test2');
        expect(message2).toBe(1);
        expect(message1).toBe(0);
        message1 = 0;
        message2 = 0;
        // if the sender is not in the channel, it should throw an error
        expect(function () { return channel.sendTo('testEvent', { test: 'test' }, 'test3', 'test2'); }).toThrowError();
        // if the receiver is not in the channel, it should throw an error
        expect(function () { return channel.sendTo('testEvent', { test: 'test' }, 'test1', 'test3'); }).toThrowError();
        // it should send to multiple users
        channel.sendTo('testEvent', { test: 'test' }, 'test1', ['test2', 'test1']);
        expect(message2 + message1).toBe(2);
        message1 = 0;
        message2 = 0;
        channel.subscribe(function (event) {
            if (event.event === 'testEvent' && event.clientId === 'test1')
                return new pondbase_1.PondError('test', 500, {
                    event: 'testEvent',
                    channelName: 'test',
                });
        });
        expect(function () { return channel.sendTo('testEvent', { test: 'test' }, 'test1', 'test2'); }).toThrowError();
        expect(message2).toBe(0);
        expect(message1).toBe(0);
        //when the server calls this method, it should send the message to the user even the sender does not exist in the channel
        channel.sendTo('testEvent', { test: 'test' }, 'SERVER', 'test2');
        expect(message2).toBe(1);
        expect(message1).toBe(0);
        sub2.unsubscribe();
        sub1.unsubscribe();
    });
});
