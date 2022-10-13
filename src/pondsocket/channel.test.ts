import {Channel, ChannelEvent} from "./channel";
import {PondSenders, ServerActions} from "./enums";
import {PondError} from "../pondbase";

describe('Channel', () => {
    it('should exist', () => {
        expect(Channel).toBeDefined();
    });

    it('should be a class', () => {
        expect(Channel).toBeInstanceOf(Function)
    });

    it('should have a addUser method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('addUser');
    })

    it('should have a removeUser method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('removeUser');
    })

    it('should have a getUserInfo method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('getUserInfo');
    })

    it('should have a updateUser method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('updateUser');
    })

    it('should have a broadcast method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('broadcast');
    })

    it('should have a broadcastFrom method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('broadcastFrom');
    })

    it('should have a sendTo method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('sendTo');
    })

    it('should have a _sendToClients method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('_sendToClients');
    })

    it('should have a subscribe method', () => {
        expect(new Channel('test', () => {
        })).toHaveProperty('subscribe');
    })

    // Functionality tests

    it('should add a user to the channel', () => {
        const lastSeenDate = new Date();
        const channel = new Channel('test', () => {
        });
        const user = {
            client: {
                clientId: 'test',
                socket: {
                    send: () => {
                    },
                    on: () => {
                    }
                } as any
            },
            presence: {
                status: 'online',
                lastSeen: lastSeenDate
            },
            assigns: {},
            channelData: {}
        }

        channel.addUser(user);

        expect(channel.getUserInfo('test')).toEqual({
            presence: {
                id: 'test',
                status: 'online',
                lastSeen: lastSeenDate
            },
            assigns: {},
        });
    })

    it('should send error to user if addUser is called with an existing user', () => {
        const channel = new Channel('test', () => {
        });
        const user = {
            client: {
                clientId: 'test'
            },
            presence: {
                status: 'online',
                lastSeen: new Date()
            },
            assigns: {},
            channelData: {}
        }

        channel.addUser(user);

        expect(() => channel.addUser(user)).toThrowError(PondError);
    });

    it('should remove a user from the channel', () => {
        const lastSeenDate = new Date();
        const channel = new Channel('test', () => {
        });
        const user = {
            client: {
                clientId: 'test',
                socket: {
                    send: () => {
                    },
                    on: () => {
                    }
                } as any
            },
            presence: {
                status: 'online',
                lastSeen: lastSeenDate
            },
            assigns: {},
            channelData: {}
        }

        channel.addUser(user);
        channel.removeUser('test');

        expect(channel.getUserInfo('test')).toBeNull();
    })

    it('should update a user in the channel', () => {
        const lastSeenDate = new Date();
        const channel = new Channel('test', () => {
        });
        const user = {
            client: {
                clientId: 'test',
                socket: {
                    send: () => {
                    },
                    on: () => {
                    }
                } as any
            },
            presence: {
                status: 'online',
                lastSeen: lastSeenDate
            },
            assigns: {},
            channelData: {}
        }

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
        channel.updateUser('test',
            {
                status: 'offline'
            },
            {
                test: 'test'
            }
        );

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
        channel.updateUser('test',
            {
                status: 'online'
            }, {}
        );

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
    })

    it('should broadcast a message when a user is added', (done) => {
        const lastSeenDate = new Date();
        const channel = new Channel('test', () => {
        });

        const subscription = channel.subscribe((message) => {
            const expectedMessage: ChannelEvent = {
                action: ServerActions.PRESENCE,
                event: 'JOIN_CHANNEL',
                channelName: 'test',
                clientId: PondSenders.POND_CHANNEL,
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
            }
            expect(message).toEqual(expectedMessage);
            subscription.unsubscribe();
            done();
        });

        const user = {
            client: {
                clientId: 'test',
            },
            presence: {
                status: 'online',
                lastSeen: lastSeenDate.toString()
            },
            assigns: {},
            channelData: {}
        }

        channel.addUser(user);
        channel.removeUser('test'); // this broadcast will not be received by the subscription as it unsubscribes after the first message
        expect(channel.getUserInfo('test')).toBeNull();
    });

    it('should broadcast to all users when a user presence is added / updated / removed', () => {
        let joins = 0;
        let updates = 0;

        const channel = new Channel('test', () => {
        });

        const sub = channel.subscribe((data) => {
            if (data.action === ServerActions.PRESENCE) {
                if (data.event === 'JOIN_CHANNEL')
                    joins++;

                else if (data.event === 'LEAVE_CHANNEL')
                    joins--;

                else
                    updates++;
            }
        });

        const user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const user3 = {
            client: {
                clientId: 'test3',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

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
    })

    it('should set and get the channel data', () => {
        const channel = new Channel('test', () => {
        });

        channel.data = {
            test: 'test'
        };

        expect(channel.data).toStrictEqual({
            test: 'test'
        });
    })

    it('should get channel info', () => {
        const channel = new Channel('test', () => {
        });

        channel.addUser({
            client: {
                clientId: 'test1',
            },
            presence: {status: 'online'},
            assigns: {},
            channelData: {name: 'test1'}
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
        })

        channel.data = {
            test: 'test'
        }

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
        })
    });

    it('should be possible to remove multiple users at once', () => {
        const channel = new Channel('test', () => {});

        const user1 = {
            client: {
                clientId: 'test1',
                socket: {
                    send: () => {},
                    on: () => {}
                } as any
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const user2 = {
            client: {
                clientId: 'test2',
                socket: {
                    send: () => {},
                    on: () => {}
                } as any
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        channel.addUser(user1);
        channel.addUser(user2);

        expect(channel.info.presence.length).toBe(2);

        channel.removeUser(['test1', 'test2']);

        expect(channel.info.presence.length).toBe(0);
    });

    it('should broadcast a message to all users in the channel', () => {
        const channel = new Channel('test', () => {});
        let receivedMessages: any[] = [];

        const sub = channel.subscribe((message) => {
            receivedMessages.push(message);
        });

        const user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        channel.addUser(user1);
        channel.addUser(user2);

        expect(channel.info.presence.length).toBe(2);
        expect(receivedMessages.length).toBe(2); //  1 join message for each user

        receivedMessages = [];

        channel.broadcast('testEvent', {test: 'test'});
        expect(receivedMessages.length).toBe(1);
        sub.unsubscribe();
    });

    it('should broadcast a message to all users in the channel except the sender', () => {
        const channel = new Channel('test', () => {});
        let addresses: string[] = [];

        const user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const sub = channel.subscribeToMessages('test1', (_) => {
            addresses.push('test1');
        })

        const user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        //we add the listener first to make sure that the user gets updates on their own join
        channel.addUser(user1);

        //unlike a normal subscription, this subscription will receive messages when the channel's presence is updated
        const sub2 = channel.subscribeToMessages('test2', (_) => {
            addresses.push('test2');
        })

        channel.addUser(user2);

        expect(channel.info.presence.length).toBe(2);
        expect(addresses.length).toBe(3); // 3 joins messages because the first user recieves the join message from the second user as well as their own

        addresses = [];

        channel.broadcastFrom('testEvent', {test: 'test'}, 'test1');
        expect(addresses.length).toBe(1);
        sub.unsubscribe();
        sub2.unsubscribe();
    });

    it('should interrupt broadcast if a subscriber returns a PondError', () => {
        const channel = new Channel('test', () => {});
        let receivedMessages: any[] = [];

        channel.subscribe(event => {
            if (event.event === 'testEvent' && event.clientId === 'test1')
                return new PondError('test', 500, {
                    event: 'testEvent',
                    channelName: 'test'
                });

            receivedMessages.push(event);
        });

        const user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        channel.addUser(user1);
        channel.addUser(user2);

        expect(channel.info.presence.length).toBe(2);
        expect(receivedMessages.length).toBe(2); //  1 join message for each user
        // the sockets themselves are not subscribed to this pubSub as it is possible for an external actor to interrupt the broadcast
        // seeing as this is vital information, we need to make sure that all users gets the message even though external subscribers can interrupt the broadcast
        // the users are thus subscribed to the pubSub directly and not through the channel's subscribe method

        receivedMessages = [];

        expect(() => channel.broadcast('testEvent', {test: 'test'}, 'test1')).toThrow(PondError);
        // when a subscriber interrupts the broadcast, the message is not sent to the user that sent the message and an error is thrown

        expect(receivedMessages.length).toBe(0);  // since the subscriber returned a PondError, No message was sent
        // in this case when it's messages being sent the users get the messages only after external actors do. this way the users can be sure that the message was sent
        // if an external actor interrupts the broadcast, the users will not get the message

        receivedMessages = [];

        channel.broadcast('testEvent', {test: 'test'});
        expect(receivedMessages.length).toBe(1); // A message is sent to all users

        receivedMessages = [];

        expect(() => channel.broadcastFrom('testEvent', {test: 'test'}, 'test1')).toThrowError(PondError)
        expect(receivedMessages.length).toBe(0);  // since the subscriber returned a PondError, the broadcast should be interrupted

        receivedMessages = [];

        channel.broadcastFrom('testEvent', {test: 'test'}, 'test2');
        expect(receivedMessages.length).toBe(1);

        receivedMessages = [];

        // when you attempt to broadcastFrom a user that doesn't exist, it should throw an error
        expect(() => channel.broadcastFrom('testEvent', {test: 'test'}, 'test3')).toThrowError();

        receivedMessages = [];

        // when you attempt to broadcast with a user that doesn't exist, it should throw an error
        expect(() => channel.broadcast('testEvent', {test: 'test'}, 'test3')).toThrowError();
    });

    it('should send messages to a specific user | users', () => {
        const channel = new Channel('test', () => {});
        let message1 = 0;
        let message2 = 0;

        const user1 = {
            client: {
                clientId: 'test1',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const user2 = {
            client: {
                clientId: 'test2',
            },
            presence: {},
            assigns: {},
            channelData: {}
        }

        const sub1 = channel.subscribeToMessages('test1', (_) => {
            message1++;
        });

        channel.addUser(user1);

        const sub2 = channel.subscribeToMessages('test2', (_) => {
            message2++;
        });

        channel.addUser(user2);

        expect(channel.info.presence.length).toBe(2);
        expect(message1 + message2).toBe(3); // 3 joins

        message1 = 0;
        message2 = 0;

        channel.sendTo('testEvent', {test: 'test'}, 'test1', 'test2');
        expect(message2).toBe(1);
        expect(message1).toBe(0);

        message1 = 0;
        message2 = 0;

        // if the sender is not in the channel, it should throw an error
        expect(() => channel.sendTo('testEvent', {test: 'test'}, 'test3', 'test2')).toThrowError();

        // if the receiver is not in the channel, it should throw an error
        expect(() => channel.sendTo('testEvent', {test: 'test'}, 'test1', 'test3')).toThrowError();

        // it should send to multiple users
        channel.sendTo('testEvent', {test: 'test'}, 'test1',['test2', 'test1']);
        expect(message2 + message1).toBe(2);

        message1 = 0;
        message2 = 0;

        channel.subscribe(event => {
            if (event.event === 'testEvent' && event.clientId === 'test1')
                return new PondError('test', 500, {
                    event: 'testEvent',
                    channelName: 'test',
                });
        });

        expect(() => channel.sendTo('testEvent', {test: 'test'}, 'test1', 'test2')).toThrowError();
        expect(message2).toBe(0);
        expect(message1).toBe(0);

        //when the server calls this method, it should send the message to the user even the sender does not exist in the channel
        channel.sendTo('testEvent', {test: 'test'}, 'SERVER', 'test2');
        expect(message2).toBe(1);
        expect(message1).toBe(0);

        sub2.unsubscribe();
        sub1.unsubscribe();
    });

});
