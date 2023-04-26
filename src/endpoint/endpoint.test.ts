import request from 'superwstest';

import { SystemSender, ServerActions, ErrorTypes, ClientActions, Events, ChannelReceiver } from '../enums';
import { PondSocket } from '../server/pondSocket';

/* eslint-disable line-comment-position, no-inline-comments */

describe('endpoint', () => {
    let socket: PondSocket;
    let server: any;

    beforeEach((done) => {
        socket = new PondSocket();
        server = socket.listen(3000, 'localhost', done);
    });

    afterEach((done) => {
        server.close(done);
    });

    /* it('should be able to close a socket', async () => {
        const { socket, server } = createPondSocket();

        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.accept();

            setTimeout(() => {
                endpoint.closeConnection(req.id);
            }, 100);
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .wait(200)
            .expectClosed();

        server.close();
    });

    it('should be able to list connections', async () => {
        const { socket, server } = createPondSocket();
        let connectionsCount = 0;

        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            connectionsCount = endpoint.listConnections().length;
            res.accept();
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101));

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101));

        server.close(); // Close the server to stop the connection from being kept alive
        expect(connectionsCount).toBe(1);
        expect(endpoint.listConnections().length).toBe(2); // The connections are still in the list
    });

    it('should be able to refuse connections to the endpoint', async () => {
        const { socket, server } = createPondSocket();

        expect(server).toBeDefined();
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.reject();
        });

        await request(server)
            .ws('/api/socket')
            .expectConnectionError(); // The connection should be refused

        server.close();
    });

    it('should be capable of sending messages to all clients', async () => {
        const { socket, server } = createPondSocket();

        expect(server).toBeDefined();

        let users = 0;
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            users++;
            res.send('Hello', { room: req.params.room });
            if (users > 0) {
                endpoint.broadcast('TEST', { message: 'Hello everyone' });
            }
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                event: 'Hello',
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.SYSTEM,
                payload: {
                    room: 'socket',
                },
            })
            .expectJson({
                event: 'TEST',
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.BROADCAST,
                payload: {
                    message: 'Hello everyone',
                },
            })
            .close()
            .expectClosed();

        await request(server)
            .ws('/api/secondSocket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                event: 'Hello',
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.SYSTEM,
                payload: {
                    room: 'secondSocket',
                },
            })
            .expectJson({
                event: 'TEST',
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.BROADCAST,
                payload: {
                    message: 'Hello everyone',
                },
            })
            .close()
            .expectClosed();

        server.close();
    });

    it('should be able to accept connections on this handler', async () => {
        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        const { socket, server, createPondChannel } = createPondSocket();

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const testPond = createPondChannel();
        const socketPond = createPondChannel();

        testPond.onJoinRequest((req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.accept({
                assigns: {
                    status: 'online',
                },
            });
        });

        socketPond.onJoinRequest((req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.accept({
                assigns: {
                    status: 'online socket',
                },
            });
        });

        endpoint.addChannel('/test/:room', testPond);
        endpoint.addChannel('/socket/:room', socketPond);

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .close()
            .expectClosed();

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message,
                channelName: '/socket/socket',
            })
            .close()
            .expectClosed();

        expect(endpoint['_channels']).toHaveLength(2);
        server.close();
    });

    it('should refuse connections if there are no pondChannel handlers', async () => {
        const { socket, server, createPondChannel } = createPondSocket();

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const testPond = createPondChannel();

        testPond.onJoinRequest((req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.accept({
                assigns: {
                    status: 'online',
                },
            });
        });

        endpoint.addChannel('/test/:room', testPond);

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .close()
            .expectClosed();

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message,
                channelName: '/socket/socket', // This channel handler does not exist
            })
            .expectJson({
                event: ErrorTypes.INTERNAL_SERVER_ERROR,
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.ERROR,
                payload: {
                    message: 'GatewayEngine: Channel /socket/socket does not exist',
                },
            })
            .close()
            .expectClosed();

        server.close();
        expect(endpoint['_channels']).toHaveLength(1);
    });

    it('should send an error when the channel exists but other things happen', async () => {
        const { socket, server, createPondChannel } = createPondSocket();

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = createPondChannel();

        channel.onEvent(':room', (req, res) => {
            if (req.event.params.room === 'TEST') {
                res.accept()
                    .broadcast(req.event.event, req.event.payload);
            } else if (req.event.params.room === 'TEST2') {
                res.reject();
            } else {
                res.reject('choke on my balls');
            }
        });

        channel.onJoinRequest((_, res) => {
            res.accept();
        });

        endpoint.addChannel('/test/:room', channel);

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message) // Join the channel
            .sendJson({
                ...message,
                channelName: '/test/socket',
                action: ClientActions.BROADCAST,
            })
            .expectJson({
                payload: {},
                event: 'TEST',
                channelName: '/test/socket',
                action: ServerActions.BROADCAST,
            })
            .expectJson({
                payload: {},
                event: 'TEST',
                channelName: '/test/socket',
                action: ServerActions.BROADCAST,
            })
            .sendJson({
                ...message,
                event: 'TEST2',
                channelName: '/test/socket',
                action: ClientActions.BROADCAST,
            })
            .expectJson({
                action: ServerActions.ERROR,
                event: ErrorTypes.UNAUTHORIZED_BROADCAST,
                payload: {
                    message: 'Unauthorized request',
                    code: 403,
                },
                channelName: '/test/socket',
            })
            .sendJson({
                ...message,
                event: 'TEST3',
                channelName: '/test/socket',
                action: ClientActions.BROADCAST,
            })
            .expectJson({
                action: ServerActions.ERROR,
                event: ErrorTypes.UNAUTHORIZED_BROADCAST,
                payload: {
                    message: 'choke on my balls',
                    code: 403,
                },
                channelName: '/test/socket',
            })
            .close()
            .expectClosed();

        server.close();
        expect(endpoint['_channels']).toHaveLength(1);
    });

    it('should be able to track the presence of its users', async () => {
        const { socket, server, createPondChannel } = createPondSocket();

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = createPondChannel();

        channel.onJoinRequest((_, res) => {
            res.accept().trackPresence({
                status: 'online',
            });
        });

        endpoint.addChannel('/test/:room', channel);

        const message: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
                event: PresenceEventTypes.JOIN,
                channelName: '/test/socket',
                action: ServerActions.PRESENCE,
                payload: {
                    changed: {
                        status: 'online',
                    },
                    presence: [
                        {
                            status: 'online',
                        },
                    ],
                },
            })
            .close()
            .expectClosed();

        server.close();
        expect(endpoint['_channels']).toHaveLength(1);
    });

    it('should throw an error when we try to leave a channel that does not exist', async () => {
        const { socket, server, createPondChannel } = createPondSocket();

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = createPondChannel();

        channel.onJoinRequest((_, res) => {
            res.send('TEST', { test: 'test' });
        });

        endpoint.addChannel('/test/:room', channel);

        const message: ClientMessage = {
            action: ClientActions.LEAVE_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
                event: ErrorTypes.INTERNAL_SERVER_ERROR,
                channelName: 'ENDPOINT',
                action: ServerActions.ERROR,
                payload: {
                    message: 'GatewayEngine: Channel /test/socket does not exist',
                },
            })
            // now join the channel
            .sendJson({
                ...message,
                action: ClientActions.JOIN_CHANNEL,
            })
            .expectJson({
                event: 'TEST',
                channelName: '/test/socket',
                action: ServerActions.SYSTEM,
                payload: {
                    test: 'test',
                },
            })
            // now leave the channel
            .sendJson(message)
            .close()
            .expectClosed();

        server.close();
        expect(endpoint['_channels']).toHaveLength(1);

        // every pond channel can potentially hold a lot of channels
        // remember that the path a pond channel is created with is a regex pattern
        // and every channel that matches that pattern will be added to the pond channel
        // e.g. /test/:room will match /test/1, /test/2, /test/3, /test/4, ... etc
        // But also when a channel no longer has any users, it will be removed from the pond channel
        expect(channel['_channels'].size).toEqual(0);
    });

    it('should be able to close multiple sockets', async () => {
        const { socket, server } = createPondSocket();

        expect(server).toBeDefined();

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.send('TEST', { test: 'test' });

            const sockets = endpoint.listConnections();

            endpoint.closeConnection(sockets);
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                event: 'TEST',
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.SYSTEM,
                payload: {
                    test: 'test',
                },
            })
            .expectClosed();

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                event: 'TEST',
                channelName: SystemSender.ENDPOINT,
                action: ServerActions.SYSTEM,
                payload: {
                    test: 'test',
                },
            })
            .expectClosed();

        server.close();
    });*/

    it('should be able to close a single socket', async () => {
        let count = 0;
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            if (req.params.room === 'socket') {
                res.accept();
                count++;

                setTimeout(() => {
                    endpoint.closeConnection(req.id);
                }, 1000);
            } else {
                res.reject();
            }
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .wait(200)
            .expectClosed();

        expect(count).toBe(1);
    });

    it('should be able to list connections', async () => {
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            if (req.params.room === 'socket') {
                res.accept();

                const connections = endpoint.listConnections();

                expect(connections).toHaveLength(1);
            } else {
                res.reject();
            }
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101));
    });

    it('should be able to refuse connections to the endpoint', async () => {
        let count = 0;

        socket.createEndpoint('/api/:path', (req, res) => {
            count++;
            expect(req.params.path).toBe('socket');
            res.reject();
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101)) // the connection is still upgraded, so we can send error messages
            .expectJson({
                action: ServerActions.ERROR,
                event: ErrorTypes.UNAUTHORIZED_CONNECTION,
                channelName: SystemSender.ENDPOINT,
                payload: {
                    message: 'Unauthorized connection',
                    code: 401,
                },
            })
            .expectClosed();

        expect(count).toBe(1);
    });

    it('should be able to send a message to all connection', async () => {
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            if (req.params.room === 'socket') {
                res.accept();

                const connections = endpoint.listConnections();

                expect(connections).toHaveLength(1);

                endpoint.broadcast('TEST', { test: 'test' });
            } else {
                res.reject();
            }
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                event: 'TEST',
                action: ServerActions.BROADCAST,
                channelName: SystemSender.ENDPOINT,
                payload: {
                    test: 'test',
                },
            });
    });

    it('should be able to accept connections on this handler', async () => {
        const message = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            if (req.params.room === 'socket') {
                res.accept();
            } else {
                res.reject();
            }
        });

        endpoint.createChannel('/test/:room', (req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.accept({
                assigns: {
                    status: 'online',
                },
            });
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .close()
            .expectClosed();

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson({
                ...message,
                channelName: '/socket/socket',
            })
            .expectJson({
                action: ServerActions.ERROR,
                channelName: SystemSender.ENDPOINT,
                event: ErrorTypes.ENDPOINT_ERROR,
                payload: {
                    message: 'GatewayEngine: Channel /socket/socket does not exist',
                    code: 404,
                },
            })
            .close()
            .expectClosed();
    });

    it('should send an error when the channel exists but other things happen', async () => {
        const message = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        endpoint.createChannel('/test/:room', (req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.reject('Something went wrong');
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
                action: ServerActions.ERROR,
                channelName: '/test/socket',
                event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
                payload: {
                    message: 'Request to join channel /test/socket rejected: Something went wrong',
                    code: 403,
                },
            })
            .close()
            .expectClosed();
    });

    it('should be able to track the presence of its users', async () => {
        const message = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        endpoint.createChannel('/test/:room', (req, res) => {
            expect(req.event.params.room).toBeDefined();
            res
                .accept()
                .trackPresence({
                    status: 'online',
                });
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
                action: ServerActions.SYSTEM,
                channelName: '/test/socket',
                event: Events.ACKNOWLEDGE,
                payload: {},
            });
    });

    it('should throw an error if accept, reject / send is called more than once', async () => {
        socket.createEndpoint('/api/:room', (_, res) => {
            res.send('hello', {
                test: 'test',
            });

            expect(() => res.accept()).toThrowError('Cannot execute response more than once');
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                action: ServerActions.BROADCAST,
                channelName: SystemSender.ENDPOINT,
                event: 'hello',
                payload: {
                    test: 'test',
                },
            });
    });

    it('should be able to connect, join a channel and send a message', async () => {
        const message = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: '/test/socket',
            event: 'TEST',
            payload: {},
        };

        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });

        const channel = endpoint.createChannel('/test/:room', (req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.accept();
        });

        channel.onEvent('echo', (req, res) => {
            res.send('echo', req.event.payload);
        });

        channel.onEvent('broadcast', (req) => {
            channel.broadcast('broadcast', {
                ...req.event.payload,
                broadcast: true,
            });
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
                action: ServerActions.SYSTEM,
                channelName: '/test/socket',
                event: Events.ACKNOWLEDGE,
                payload: {},
            })
            .sendJson({
                addresses: ChannelReceiver.ALL_EXCEPT_SENDER,
                action: ClientActions.BROADCAST,
                channelName: '/test/socket',
                event: 'echo',
                payload: {
                    test: 'test',
                },
            })
            .expectJson({
                action: ServerActions.SYSTEM,
                channelName: '/test/socket',
                event: 'echo',
                payload: {
                    test: 'test',
                },
            })
            .sendJson({
                action: ClientActions.BROADCAST,
                channelName: '/test/socket',
                event: 'broadcast',
                payload: {
                    test: 'test',
                },
            })
            .expectJson({
                action: ServerActions.SYSTEM,
                channelName: '/test/socket',
                event: 'broadcast',
                payload: {
                    test: 'test',
                    broadcast: true,
                },
            });
    });
});