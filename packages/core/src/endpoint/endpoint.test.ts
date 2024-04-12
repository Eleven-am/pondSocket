import { Server } from 'net';

import {
    ChannelEvent,
    ChannelReceiver,
    ClientActions,
    ErrorTypes,
    Events,
    ServerActions,
    SystemSender,
} from '@eleven-am/pondsocket-common';
import request from 'superwstest';

import { EndpointEngine, SocketCache } from './endpoint';
import { PondSocket } from '../server/pondSocket';

/* eslint-disable line-comment-position, no-inline-comments */

export const createEndpointEngine = (socket: SocketCache) => ({
    createChannel: jest.fn(),
    listConnections: jest.fn(),
    getClients: jest.fn(),
    broadcast: jest.fn(),
    closeConnection: jest.fn(),
    manageSocket: jest.fn(),
    getUser: () => socket,
    subscribeTo: jest.fn(),
    unsubscribeFrom: jest.fn(),
    sendMessage: (socket: WebSocket, msg: ChannelEvent) => socket.send(JSON.stringify(msg)),
} as any as EndpointEngine);

describe('endpoint', () => {
    let socket: PondSocket;
    let server: Server;

    beforeEach((done) => {
        socket = new PondSocket();
        server = socket.listen(3000, 'localhost', () => {
            done();
        });
    });

    afterEach((done) => {
        server.close(() => {
            done();
        });
    });

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
                res.decline();
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

                const connections = endpoint.getClients();

                expect(connections).toHaveLength(1);
            } else {
                res.decline();
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
            res.decline();
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101)) // the connection is still upgraded, so we can send error messages
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.ERROR,
                    event: ErrorTypes.UNAUTHORIZED_CONNECTION,
                    channelName: SystemSender.ENDPOINT,
                    payload: {
                        message: 'Unauthorized connection',
                        code: 401,
                    },
                }),
            )
            .expectClosed();

        expect(count).toBe(1);
    });

    it('should be able to send a message to all connection', async () => {
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            if (req.params.room === 'socket') {
                res.accept();

                const connections = endpoint.getClients();

                expect(connections).toHaveLength(1);

                endpoint.broadcast('TEST', { test: 'test' });
            } else {
                res.decline();
            }
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectMessage(
                expect.objectContaining({
                    event: 'TEST',
                    action: ServerActions.BROADCAST,
                    channelName: SystemSender.ENDPOINT,
                    payload: {
                        test: 'test',
                    },
                }),
            );
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
                res.decline();
            }
        });

        endpoint.createChannel('/test/:room', (req, res) => {
            expect(req.event.params.room).toBeDefined();
            res.accept().assign({
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
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.SYSTEM,
                    channelName: '/socket/socket',
                    event: Events.ACKNOWLEDGE,
                    payload: {},
                }),
            )
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
            res.decline('Something went wrong');
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.ERROR,
                    channelName: '/test/socket',
                    event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
                    payload: {
                        message: 'Request to join channel /test/socket rejected: Something went wrong',
                        code: 403,
                    },
                }),
            )
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
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.SYSTEM,
                    channelName: '/test/socket',
                    event: Events.ACKNOWLEDGE,
                    payload: {},
                }),
            )
            .close();
    });

    it('should throw an error if accept, reject is called more than once', async () => {
        socket.createEndpoint('/api/:room', (_, res) => {
            res.reply('hello', {
                test: 'test',
            });

            res.accept();
            expect(() => res.decline()).toThrowError('Cannot execute response more than once');
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.BROADCAST,
                    channelName: SystemSender.ENDPOINT,
                    event: 'hello',
                    payload: {
                        test: 'test',
                    },
                }),
            );
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
            res.reply('echo', req.event.payload);
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
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.SYSTEM,
                    channelName: '/test/socket',
                    event: Events.ACKNOWLEDGE,
                    payload: {},
                }),
            )
            .sendJson({
                addresses: ChannelReceiver.ALL_EXCEPT_SENDER,
                action: ClientActions.BROADCAST,
                channelName: '/test/socket',
                event: 'echo',
                payload: {
                    test: 'test',
                },
            })
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.SYSTEM,
                    channelName: '/test/socket',
                    event: 'echo',
                    payload: {
                        test: 'test',
                    },
                }),
            )
            .sendJson({
                action: ClientActions.BROADCAST,
                channelName: '/test/socket',
                event: 'broadcast',
                payload: {
                    test: 'test',
                },
            })
            .expectMessage(
                expect.objectContaining({
                    action: ServerActions.SYSTEM,
                    channelName: '/test/socket',
                    event: 'broadcast',
                    payload: {
                        test: 'test',
                        broadcast: true,
                    },
                }),
            );
    });
});
