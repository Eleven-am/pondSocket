import {Endpoint} from "./endpoint";
import {PondSocket as PondSocket} from "./pondSocket";
import request from "superwstest";
import {ClientActions, PondSenders, ServerActions} from "./enums";
import {ClientMessage} from "./types";

describe('endpoint', () => {
    it('should be defined', () => {
        expect(Endpoint).toBeDefined();
    });

    it('should be instantiable', () => {
        const socketServer = {} as any;
        expect(new Endpoint(socketServer, () => {
        })).toBeInstanceOf(Endpoint);
    });

    it('should have a createChannel method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.createChannel).toBeDefined();
    });

    it('should have an authoriseConnection method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.authoriseConnection).toBeDefined();
    });

    it('should have a closeConnection method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.closeConnection).toBeDefined();
    });

    it('should have a listChannels method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.listChannels).toBeDefined();
    });

    it('should have a send method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.send).toBeDefined();
    });

    it('should have a broadcast method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.broadcast).toBeDefined();
    });

    it('should have a listConnections method', () => {
        const socketServer = {} as any;
        const endpoint = new Endpoint(socketServer, () => {
        });
        expect(endpoint.listConnections).toBeDefined();
    });

    // Functionality tests

    it('should be able to close a socket', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001, () => {
        })
        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.accept();

            setTimeout(() => {
                endpoint.closeConnection(req.clientId);
            }, 100);
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .wait(200)
            .expectClosed();

        server.close();
    });

    it('should be able to list connections', async () => {
        const socket = new PondSocket();
        let connectionsCount = 0;
        const server = socket.listen(3001, () => {
        })
        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            connectionsCount = endpoint.listConnections().length;
            res.accept();
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))

        server.close(); // Close the server to stop the connection from being kept alive
        expect(connectionsCount).toBe(2);
        expect(endpoint.listConnections().length).toBe(2); // Should be 0 but it remains 2 because the tests are not waiting for the server to close
    });

    it('should be capable of sending messages to all clients', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001, () => {
        })

        expect(server).toBeDefined();

        let users = 0;
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            users++;
            res.send('Hello', {room: req.params.room});
            if (users > 0) endpoint.broadcast('TEST', {message: 'Hello everyone'});
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .expectJson({
                action: 'MESSAGE', event: 'Hello', channelName: 'SERVER', payload: {
                    room: 'socket'
                }
            })
            .expectJson({
                action: 'MESSAGE', event: 'TEST', channelName: `ENDPOINT`, payload: {
                    message: 'Hello everyone'
                }
            });

        await request(server)
            .ws('/api/secondSocket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .expectJson({
                action: 'MESSAGE', event: 'Hello', channelName: 'SERVER', payload: {
                    room: 'secondSocket'
                }
            })
            .expectJson({
                action: 'MESSAGE', event: 'TEST', channelName: 'ENDPOINT', payload: {
                    message: 'Hello everyone'
                }
            });

        server.close();
    });

    it('should be able to accept connections on this handler', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001, () => {
        })
        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept({
                presence: {
                    status: 'online',
                }
            });
        });

        endpoint.createChannel('/socket/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept({
                presence: {
                    status: 'online socket',
                }
            });
        });

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message, channelName: '/socket/socket'
            })
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic

        expect(endpoint['_channels'].toArray()).toHaveLength(2);
        server.close();
    });

    it('should refuse connections if there are no handlers', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001, () => {
        })
        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept({
                presence: {
                    status: 'online',
                }
            });
        });

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message, channelName: '/socket/socket' // This channel handler does not exist
            })
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic

        expect(endpoint['_channels'].toArray()).toHaveLength(1);
        server.close();
    });

    it('should send an error when we send an incomplete message', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001, () => {
        })
        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept({
                presence: {
                    status: 'online',
                }
            });
        });

        const message: ClientMessage = {
            action: ClientActions.LEAVE_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
                action: "ERROR", event: "LEAVE_CHANNEL", channelName: "/test/socket", payload: {
                    message: "Channel not found", code: 404
                }
            })

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message, action: null
            })
            .expectJson({
                action: "ERROR", event: "INVALID_MESSAGE", channelName: PondSenders.ENDPOINT, payload: {
                    message: "No action provided",
                }
            })

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message, action: ClientActions.BROADCAST, channelName: null
            })
            .expectJson({
                action: "ERROR", event: "INVALID_MESSAGE", channelName: PondSenders.ENDPOINT, payload: {
                    message: "No channel name provided",
                }
            });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message, action: ClientActions.BROADCAST_FROM, payload: null
            })
            .expectJson({
                action: "ERROR", event: "INVALID_MESSAGE", channelName: PondSenders.ENDPOINT, payload: {
                    message: "No payload provided",
                }
            });

        // send incorrect Json message
        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .send('"action": "JOIN_CHANNEL", "channelName": "/test/socket", "event": "TEST", "payload": {}}')
            .expectJson({
                action: "ERROR", event: "INVALID_MESSAGE", channelName: PondSenders.ENDPOINT, payload: {
                    message: "Invalid message",
                }
            });


        expect(endpoint['_channels'].toArray()).toHaveLength(1);
        server.close();
    });

    it('should send an error when the channel exists but other things happen', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3005, () => {
        })
        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept();
        });

        channel.on('/test/:room', (req, res, _) => {
            if (req.params.room === 'TEST') {
                res.accept();
            } else if (req.params.room === 'TEST2') {
                res.reject();
            } else if (req.params.room === 'TEST3') {
                res.reject('choke on my balls');
            } else res.reject('TEST');
        });

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson({
                ...message, event: '/test/TEST2', action: ClientActions.BROADCAST,
            })
            .expectJson({
                action: "ERROR", event: "/test/TEST2", channelName: "/test/socket", payload: {
                    message: "Message rejected", code: 403
                }
            })
            .sendJson({
                ...message, channelName: "/test/socket", action: ClientActions.BROADCAST,
            })
            .expectJson({
                action: ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
            })
            .sendJson({
                ...message, action: ClientActions.SEND_MESSAGE_TO_USER,
            })
            .expectJson({
                action: "ERROR", event: "TEST", channelName: "/test/socket", payload: {
                    message: "No addresses provided", code: 400
                }
            })

        expect(endpoint.listChannels()).toHaveLength(1);
        server.close();
    });

    it('should be capable of sending messages to a specific user', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3006, () => {
        })

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept();
        });

        channel.on('/test/:room', (req, res, _) => {
            if (req.params.room === 'TEST') {
                res.accept();
            } else if (req.params.room === 'TEST2') {
                res.reject();
            } else if (req.params.room === 'TEST3') {
                res.reject('choke on my balls');
            } else res.reject('TEST');
        });

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson({
                ...message, action: ClientActions.BROADCAST_FROM, payload: {
                    message: {
                        action: ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                    }
                }
            })

        expect(endpoint.listChannels()).toHaveLength(1);
        server.close();
    });

    it('should be able to update user presence on user demand', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3005, () => {
        })
        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept();
        });

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson({
                ...message, action: ClientActions.UPDATE_PRESENCE, payload: {
                    presence: {
                        status: 'online'
                    }
                }
            })
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson({
                ...message, action: ClientActions.SEND_MESSAGE_TO_USER, addresses: [], payload: {}
            })
            .expectJson({
                action: "ERROR", event: "TEST", channelName: "/test/socket", payload: {
                    message: "No addresses provided", code: 400
                }
            })
            .sendJson({
                ...message, action: ClientActions.SEND_MESSAGE_TO_USER, addresses: ['hello'], payload: {}
            })
            .expectJson({
                action: "ERROR", event: "INVALID_MESSAGE", channelName: "END_POINT", payload: {
                    message: "Recipient not found", code: 5002, data: ['hello']
                }
            })
            .sendJson({
                ...message, action: ClientActions.UPDATE_PRESENCE, payload: {
                    assigns: {
                        status: 'online'
                    }
                }
            })
            .close()
            .expectClosed();

        expect(endpoint.listChannels()).toHaveLength(1); // the channel has not been removed yet

        await request(server)
            .ws('/api/newSocket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message, channelName: '/test/socket2',
            })
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson({
                ...message, action: ClientActions.LEAVE_CHANNEL,
                channelName: '/test/socket2',
            })
            .expectJson()

        expect(endpoint.listChannels()).toHaveLength(0) // by now the first channel should have been removed; and since we gracefully closed the connection, the second channel should have been removed as well
        server.close();
    });

    it('should ba able to send messages to a specific user', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3004, () => {})
        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept();
        });

        channel.on(':room', (req, res, _) => {
            if (req.params.room === 'TEST') {
                endpoint.send(req.client.clientId, 'Test', {message: 'hello'});
                res.accept();
            }
        });

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        }

        await request(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson({
                ...message, action: ClientActions.BROADCAST_FROM, payload: {
                    message: {
                        action: ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                    }
                }
            }).expectJson({
                action: ServerActions.MESSAGE,
                event: 'Test', channelName: PondSenders.ENDPOINT,
                payload: {
                    message: 'hello'
                }
            })

        expect(endpoint.listChannels()).toHaveLength(1);
        server.close();
    });
});
