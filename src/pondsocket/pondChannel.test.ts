import {PondChannel} from "./pondChannel"
import {Channel} from "./channel";
import {PondDocument, PondError} from "../pondbase";

describe('PondChannel', () => {
    it('should exists', () => {
        expect(PondChannel).toBeDefined();
    });

    it('should be a class', () => {
        expect(PondChannel).toBeInstanceOf(Function);
    });

    it('should have a method on', () => {
        expect(PondChannel.prototype.on).toBeDefined();
    });

    it('should have a method addUser', () => {
        expect(PondChannel.prototype.addUser).toBeDefined();
    });

    it('should have a method broadcastToChannel', () => {
        expect(PondChannel.prototype.broadcastToChannel).toBeDefined();
    });

    it('should have a method closeFromChannel', () => {
        expect(PondChannel.prototype.closeFromChannel).toBeDefined();
    })

    it('should have a method modifyPresence', () => {
        expect(PondChannel.prototype.modifyPresence).toBeDefined();
    });

    it('should have a method getChannelInfo', () => {
        expect(PondChannel.prototype.getChannelInfo).toBeDefined();
    });

    it('should have a method send', () => {
        expect(PondChannel.prototype.send).toBeDefined();
    });

    it('should have a method findChannel', () => {
        expect(PondChannel.prototype.findChannel).toBeDefined();
    });

    it('should have a method subscribe', () => {
        expect(PondChannel.prototype.subscribe).toBeDefined();
    });

    // Functionality tests

    it('should be able ot add a user', async () => {
        const pondChannel = new PondChannel('/test', () => {});

        let messageReceived: any = null;
        pondChannel.on('message', (message) => {
            messageReceived = message;
        });

        const channel = new Channel('/test', () => {});
        const doc = pondChannel["_channels"].set(channel);

        expect(doc).toBeDefined();
        expect(doc).toBeInstanceOf(PondDocument);
        expect(pondChannel.getChannelInfo('/test')).toEqual(doc.doc.info);

        channel.broadcast('message', {data: 'test'});
        expect(messageReceived).toBeNull(); // when you add a channel externally, it is not subscribed to bvy the pond channel

        doc.removeDoc();
        expect(() => pondChannel.getChannelInfo('/test')).toThrowError(PondError) // channel is removed from the pond channel and can not be found

        await expect(pondChannel.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send() {},
                on() {}
            } as any
        }, '/balls', {})).rejects.toEqual(new PondError('Invalid channel name', 400, {channelName: '/balls'}));
        // invalid channel name because the channel name doesn't match the pond path

        try {
            await pondChannel.addUser({
                clientId: 'test',
                assigns: {},
                socket: {
                    send() {},
                    on() {}
                } as any
            }, '/test', {});
        } catch (error: any) {
            expect(error).toBeInstanceOf(PondError); // this is because, the pondChannel handler doesn't act on the response
            expect(error).toEqual(
                new PondError('Function did not resolve a Promise', 500, {
                    channelName: '/test',
                })
            )
        }

        channel.broadcast('message', {data: 'test'});

        const newPondChannel = new PondChannel('/test', (_, res) => {
            res.accept(); // here we accept the connection
        });

        await newPondChannel.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send() {},
                on() {}
            } as any
        }, '/test', {})

        const newChannel = newPondChannel.findChannel(c => c.name === '/test');
        expect(newChannel).toBeDefined();
        expect(newChannel).toBeInstanceOf(Channel);
        expect(newChannel!.info).toEqual({
            name: '/test',
            channelData: {},
            presence: [{
                id: 'test',
            }],
            assigns: {
                test: {}
            },
        });

        const rejectPondChannel = new PondChannel('/:test', (req, res) => {
            if (req.params.test === 'balls')
                res.reject(); // here we reject the connection

            else if (req.params.test === 'rejectWithMessage')
                res.reject('test', 69420); // here we reject the connection with a message and a status code
        });

        try {
            await rejectPondChannel.addUser({
                clientId: 'test',
                assigns: {},
                socket: {
                    send() {},
                    on() {}
                } as any
            }, '/rejectWithMessage', {});
        } catch (error: any) {
            expect(error).toBeInstanceOf(PondError); // this is because we reject the connection
            expect(error).toEqual(
                new PondError('test', 69420, {
                    channelName: '/rejectWithMessage',
                })
            )
        }

        try {
            await rejectPondChannel.addUser({
                clientId: 'test',
                assigns: {},
                socket: {
                    send() {},
                    on() {}
                } as any
            }, '/balls', {});
        } catch (error: any) {
            expect(error).toBeInstanceOf(PondError); // this is because we reject the connection
            expect(error).toEqual(
                new PondError('Message rejected', 403, {
                    channelName: '/balls',
                })
            )
        }

        const acceptPondChannel = new PondChannel('/:test', (_, res) => {
            res.send('test', {
                test: 'test'
            }); // here we send a message after accepting the connection
        });

        let message: any = null;

        await acceptPondChannel.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send(data: any) {
                    message = JSON.parse(data);
                },
                on() {}
            } as any
        }, '/test', {});

        expect(message).toEqual({
            action: 'MESSAGE',
            event: 'test',
            channelName: '/test',
            payload: {
                test: 'test'
            }
        })
    });

    it('should be able to receive subscriptions', async () => {
        const pond = new PondChannel('/:test', (_, res) => {
            res.accept();
        });

        //when events are added, they are added sequentially
        // this means the first handler is called first, and the second handler is called second...
        // so if a regex handler should be added last so everything else can be tried first

        let narrowedMessageCount = 0;
        pond.on('event:test', (req, res) => {
            narrowedMessageCount++;
            if (req.params.test === 'balls')
                res.reject(); // here we reject the connection

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
                })

            else if (req.params.test === 'acceptWithAssigns')
                res.accept({
                    assigns: {
                        test: {
                            test: 'test'
                        }
                    }
                })

            else if (req.params.test === 'acceptWithChannelData')
                res.accept({
                    channelData: {
                        test: 'test'
                    }
                })

            else if (req.params.test === 'acceptWithAll')
                res.accept({
                    presence: {
                        status: 'offline'
                    },
                    assigns: {
                        test: {
                            test: 'test2'
                        }
                    },
                    channelData: {
                        test: 'test2'
                    }
                })
        });

        let encompassingMessageCount = 0;
        pond.on(/(.*?)/, (req, res) => {
            expect(req.params).toEqual({});
            // with all encompassing regex, the params should be empty
            // also if there are no other matching handlers, they would be called
            // this means that when such a handler emits an event, it would be called again if no other handlers are found to handle the event it emits
            // it is recommended to use the all encompassing regex delicately
            // as they could lead to infinite loops
            encompassingMessageCount++;
            res.send('fallback', {
                message: 'This is a fallback route'
            })
        })

        let userMessageCount = 0;
        const sender = (_data: any) => {
            userMessageCount++;
        }

        // we add two users to the pond on ethe channel /pond
        await pond.addUser({
            clientId: 'test1',
            assigns: {},
            socket: {
                send: sender,
                on() {
                }
            } as any
        }, '/pond', {});

        await pond.addUser({
            clientId: 'test2',
            assigns: {},
            socket: {
                send: sender,
                on() {
                }
            } as any
        }, '/pond', {});

        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {},
            presence: [{
                id: 'test1',
            }, {
                id: 'test2',
            }],
            assigns: {
                test1: {},
                test2: {}
            }
        });

        expect(encompassingMessageCount).toBe(2); // 1 for each user joining
        expect(userMessageCount).toBe(3); // first user gets their join event and the seconds join,

        encompassingMessageCount = 0;
        userMessageCount = 0;

        try {
            pond.broadcastToChannel('/pond', 'eventballs', {
                test: 'test'
            });
        } catch (error: any) {
            expect(error).toBeInstanceOf(PondError);
            expect(error).toEqual(
                new PondError('Message rejected', 403, {
                    channelName: '/pond',
                    event: 'eventballs'
                })
            )
        }
        // This throws because the handler rejects the message

        expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the broadcast event is not caught by the encompassing handler
        expect(userMessageCount).toBe(0); // because the :test param is balls which was rejected by the handler, the message is not sent to the client

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        try {
            pond.send('/pond', 'test2', 'eventrejectWithMessage', {
                test: 'test'
            })
        } catch (e: any) {
            expect(e).toBeInstanceOf(PondError);
            expect(e).toEqual(
                new PondError('test', 69420, {
                    channelName: '/pond',
                    event: 'eventrejectWithMessage'
                })
            )
        }

        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the send event is not caught by the encompassing handler
        expect(userMessageCount).toBe(0); // because the :test param is rejectWithMessage which was rejected by the handler with a message, the message is not sent to the client
        // a rejection message should be sent back to the emitter of the event in this case, the server

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        const channel = pond.findChannel(c => c.name === '/pond');

        expect(channel).toBeInstanceOf(Channel);
        expect(channel).not.toBeNull();

        // since the PondChannel has no way to send messages on behalf of a client we get the channel from the pond and send the message directly to the channel
        channel?.broadcast('eventaccept', {
            test: 'test'
        });

        expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the broadcast event is not caught by the encompassing handler
        expect(userMessageCount).toBe(2); // because the :test param = accept which was accepted by the handler, the message is sent to the client

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        channel?.broadcast('eventsend', {
            test: 'test'
        }, 'test2'); // the message is sent on behalf of test2

        expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(1); // the narrowed handler emits an event (test) which is caught by the encompassing handler
        // The users still don't receive the message sent by the encompassing handler because the handler sends a message to the sender of the test event, which is the narrowed handler (SERVER)
        expect(userMessageCount).toBe(3); // because the :test param = send which was accepted by the handler, the message is broadcasted (2) and the message sent by the handler is sent to the emitter(test2) (1)

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        channel?.sendTo('eventacceptWithPresence', {
            test: 'test'
        }, 'test2', 'test1');

        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(1); // the (send) message modifies the user presence, which is caught by the encompassing handler
        // The encompassing handler sends a message to the user whose presence was changed (test2)
        // The user however does not receive the message because the message is sent to the sender of the event (the channel)

        //it should be noted that during any presence update the emitter is the server and thus emitting an event on this event would not be received by the user
        expect(userMessageCount).toBe(3); // the message is sent since it was accepted in the handler
        // the user's presence is modified and sent to all users

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
            assigns: {
                test1: {},
                test2: {}
            }
        });

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        channel?.sendTo('eventacceptWithChannelData', {
            test: 'test'
        }, 'test2', 'test1');

        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the (send) message does not modify the user presence, which is not caught by the encompassing handler
        expect(userMessageCount).toBe(1); // the message is sent since it was accepted in the handler

        // however we have also modified the channel data
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {test: 'test'},
            presence: [{
                id: 'test1',
            }, {
                id: 'test2',
                status: 'online'
            }],
            assigns: {
                test1: {},
                test2: {}
            }
        });

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        channel?.sendTo('eventacceptWitAssigns', {
            test: 'test',
        }, 'test2', 'test1');

        expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
        expect(encompassingMessageCount).toBe(0); // the (send) message does not modify the user presence, which is not caught by the encompassing handler
        expect(userMessageCount).toBe(1); // the message is sent since it was accepted in the handler

        // however we have also modified the assigns
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {test: 'test'},
            presence: [{
                id: 'test1',
            }, {
                id: 'test2',
                status: 'online'
            }],
            assigns: {
                test2: {},
                test1: {}
            }
        });

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        pond.modifyPresence('/pond', 'test2', {
            presence: {}
        })

        // No messages are sent because the presence is not modified
        expect(narrowedMessageCount).toBe(0);
        expect(encompassingMessageCount).toBe(0);
        expect(userMessageCount).toBe(0);
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {test: 'test'},
            presence: [{
                id: 'test1',
            }, {
                id: 'test2',
                status: 'online'
            }],
            assigns: {
                test2: {},
                test1: {}
            }
        });

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

       try {
           pond.closeFromChannel('/pond', 'test2')
       } catch (e) {
           expect(e).toBeInstanceOf(PondError);
           // The encompassing handler sends a message to the user whose presence was changed (test2)
           // this message causes an error because the user is no longer connected to the pond
       }

        // since a user has left the channel a message is sent to all users
        expect(narrowedMessageCount).toBe(0);
        expect(encompassingMessageCount).toBe(1);
        expect(userMessageCount).toBe(1); //only the user left in the channel receives the presence change message

        encompassingMessageCount = 0;
        userMessageCount = 0;
        narrowedMessageCount = 0;

        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {test: 'test'},
            presence: [{
                id: 'test1',
            }],
            assigns: {
                test1: {}
            }
        });
    });

    it('should allow subscribing to a channel', async () => {
        const pond = new PondChannel('/:test', (_, res) => {
            res.accept();
        });

        expect(() => pond.getChannelInfo('/pond')).toThrow();

        let messageCount = 0;
        // Any message sent to the pond will be caught by this handler
        pond.subscribe('/pond', () => {
            messageCount++;
        });

        // The pond channel is created when a user subscribes to it
        expect(pond.getChannelInfo('/pond')).toEqual({
            name: '/pond',
            channelData: {},
            presence: [],
            assigns: {}
        })

        expect(pond.info).toHaveLength(1);

        pond.subscribe('/pond', () => {
            messageCount++;
        });

        // a second subscription to the pond channel does not create a new channel
        expect(pond.info).toHaveLength(1);

        let userMessageCount = 0;
        const sender = () => {
            userMessageCount++;
        }

        // we add two users to the pond on ethe channel /pond
        await pond.addUser({
            clientId: 'test1',
            assigns: {},
            socket: {
                send: sender,
                on() {
                }
            } as any
        }, '/pond', {});

        expect(messageCount).toBe(2); // the user joining the channel is caught by the 2 encompassing handlers
        expect(userMessageCount).toBe(1); // the user receives a message that they have joined the channel
    })

    it('should be capable of removing a user from a channel', async () => {
        const pond = new PondChannel('/test', (_, res) => {
            res.accept(); // here we accept the connection
        });

        let userMessageCount = 0;
        const sender = () => {
            userMessageCount++;
        }

        await pond.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send: sender,
                on() {}
            } as any
        }, '/test', {})

        await pond.addUser({
            clientId: 'test2',
            assigns: {},
            socket: {
                send: sender,
                on() {}
            },
        } as any, '/test', {})

        await pond.addUser({
            clientId: 'test3',
            assigns: {},
            socket: {
                send: sender,
                on() {}
            } as any
        }, '/test', {})

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
            assigns: {
                test: {},
                test2: {},
                test3: {}
            }
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
            assigns: {
                test: {name: 'test'},
                test2: {},
                test3: {}
            }
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

        await pond.addUser({
            clientId: 'test',
            assigns: {},
            socket: {
                send: sender,
                on() {}
            } as any
        }, '/test', {})

        expect(pond['_subscriptions']['test']).toHaveLength(1); // the subscription holds all subscriptions a user has in multiple channels

        pond['_removeSubscriptions'](['test', 'test2', 'test3'], '/test');
        expect(pond['_subscriptions']['test']).toHaveLength(0); // the subscription is empty but the user is still in the channel and pond
        expect(pond.info).toHaveLength(1); // since the user is still in the channel the pond is still active with the channel
        // it should be noted that while the user has unsubscribed they are still in the channel, they would not receive any messages
    });
})
