import request from 'superwstest';

import { ClientActions, ClientMessage } from './endpoint';
import { ServerActions, PresenceEventTypes } from '../../enums';
import { PondChannel } from '../pondChannel/pondChannel';
import { PondSocket } from '../server/pondSocket';

const createPondSocket = () => {
    const mock = jest.fn();
    const socket = new PondSocket();
    const server = socket.listen(3001, mock);

    const createPondChannel = () => new PondChannel();

    return { socket,
        server,
        mock,
        createPondChannel };
};

/* eslint-disable line-comment-position, no-inline-comments */

describe('endpoint', () => {
    it('should be able to close a socket', async () => {
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
                channelName: 'SERVER',
                action: ServerActions.SYSTEM,
                payload: {
                    room: 'socket',
                },
            })
            .expectJson({
                event: 'TEST',
                channelName: 'SERVER',
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
                channelName: 'SERVER',
                action: ServerActions.SYSTEM,
                payload: {
                    room: 'secondSocket',
                },
            })
            .expectJson({
                event: 'TEST',
                channelName: 'SERVER',
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
                event: 'error',
                channelName: 'ENDPOINT',
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
                res.accept().broadcast(req.event.event, req.event.payload);
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
            .sendJson(message)
            .sendJson({
                ...message,
                event: 'TEST2',
                action: ClientActions.BROADCAST,
            })
            .expectJson({
                event: 'error_channel',
                channelName: '/test/socket',
                action: ServerActions.ERROR,
                payload: {
                    message: 'Unauthorized request',
                    code: 403,
                },
            })
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
            .sendJson({
                ...message,
                event: 'TEST3',
                action: ClientActions.BROADCAST,
            })
            .expectJson({
                event: 'error_channel',
                channelName: '/test/socket',
                action: ServerActions.ERROR,
                payload: {
                    message: 'choke on my balls',
                    code: 403,
                },
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
                event: 'error',
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
                channelName: 'SERVER',
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
                channelName: 'SERVER',
                action: ServerActions.SYSTEM,
                payload: {
                    test: 'test',
                },
            })
            .expectClosed();
    });
});
