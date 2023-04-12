import { createServer } from 'http';

import request from 'superwstest';
import { Server } from 'ws';

import { PondSocket } from './pondSocket';
import { ServerActions } from '../channel/channelEngine';
import { Endpoint } from '../endpoint/endpoint';


describe('server', () => {
    it('should take a server and websocket server if provided', () => {
        const server = createServer();
        const socketServer = new Server({ noServer: true });
        const socket = new PondSocket(server, socketServer);

        expect(socket['_server']).toBe(server);
        expect(socket['_socketServer']).toBe(socketServer);
    });

    it('should be able to listen on a port', () => {
        const socket = new PondSocket();

        expect(socket.listen(3001, () => {
            console.log('socket');
        })).toBeDefined();
        socket['_server'].close();
    });

    it('should be able to create an endpoint', () => {
        const socket = new PondSocket();
        const endpoint = socket.createEndpoint('/api/socket', () => {
            console.log('socket');
        });

        expect(endpoint).toBeInstanceOf(Endpoint);
    });

    it('should be able to create multiple endpoints', () => {
        const server = createServer();
        const socketServer = new Server({ noServer: true });
        const socket = new PondSocket(server, socketServer);

        const endpoint = socket.createEndpoint('/api/socket', () => {
            console.log('socket');
        });
        const endpoint2 = socket.createEndpoint('/api/socket2', () => {
            console.log('socket2');
        });

        expect(endpoint).toBeInstanceOf(Endpoint);
        expect(endpoint2).toBeInstanceOf(Endpoint);
    });

    it('should be able to reject a socket', () => {
        const server = createServer();
        const socketServer = new Server({ noServer: true });
        const socket = new PondSocket(server, socketServer);

        const socketClient = {
            write: jest.fn(),
            destroy: jest.fn(),
        };

        socket.listen(3001);
        server.emit('upgrade', {}, socketClient);
        server.close();

        // these functions are called because there is no endpoint to accept the socket
        expect(socketClient.write).toHaveBeenCalled();
        expect(socketClient.destroy).toHaveBeenCalled();
    });

    it('should be able to accept a socket if a handler is provided', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001);

        expect(server).toBeDefined();
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.accept();
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .close()
            .expectClosed();

        server.close();
    });

    it('should be able to reject a socket if the handler rejects', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001);

        expect(server).toBeDefined();
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.reject();
        });

        await request(server)
            .ws('/api/socket')
            .expectConnectionError();

        server.close();
    });

    it('should be able to send a message after connection', async () => {
        const socket = new PondSocket();
        const server = socket.listen(3001);

        expect(server).toBeDefined();
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.send('testEvent', { test: 'test' });
        });

        await request(server)
            .ws('/api/socket')
            .expectUpgrade((res) => expect(res.statusCode).toBe(101))
            .expectJson({
                event: 'testEvent',
                channelName: 'SERVER',
                payload: { test: 'test' },
                action: ServerActions.SYSTEM,
            })
            .close()
            .expectClosed();

        server.close();
    });
});
