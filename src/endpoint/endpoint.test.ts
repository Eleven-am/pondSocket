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
