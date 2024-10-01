import { IncomingMessage } from 'http';
import { Socket } from 'net';

import { PondAssigns, ServerActions, SystemSender } from '@eleven-am/pondsocket-common';

import { ConnectionParams, ConnectionResponseOptions, SocketCache } from '../abstracts/types';
import { HttpError } from '../errors/httpError';
import { ConnectionResponse } from '../responses/connectionResponse';
import { MockEndpointEngine } from './mocks/endpointEngine';
import { MockWebSocket } from './mocks/mockWebSocket';

class MockWebSocketServer {
    clients = new Set();

    on = jest.fn();

    handleUpgrade = jest.fn((req, socket, head, cb) => cb());

    emit = jest.fn();
}

describe('ConnectionResponse', () => {
    let connectionResponse: ConnectionResponse;
    let mockEngine: MockEndpointEngine;
    let mockWebSocketServer: MockWebSocketServer;
    let mockParams: ConnectionParams;
    let mockOptions: ConnectionResponseOptions;

    beforeEach(() => {
        mockEngine = new MockEndpointEngine();
        mockWebSocketServer = new MockWebSocketServer();
        mockParams = {
            request: {} as IncomingMessage,
            socket: new Socket(),
            head: Buffer.from([]),
            requestId: 'request-123',
        };
        mockOptions = {
            engine: mockEngine,
            params: mockParams,
            webSocketServer: mockWebSocketServer as any,
        };
        connectionResponse = new ConnectionResponse('client-123', mockOptions);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('assign', () => {
        it('should update user assigns after execution', () => {
            const assigns: PondAssigns = { role: 'user' };

            connectionResponse.accept();
            connectionResponse.assign(assigns);
            expect(mockEngine.getUser).toHaveBeenCalledWith('client-123');
            expect(mockEngine.getUser('client-123').assigns).toEqual(assigns);
        });
    });

    describe('accept', () => {
        it('should handle upgrade and manage socket', () => {
            const handleUpgradeSpy = jest.spyOn(mockWebSocketServer, 'handleUpgrade');

            connectionResponse.accept();
            expect(handleUpgradeSpy).toHaveBeenCalled();
            expect(mockEngine.manageSocket).toHaveBeenCalled();
        });

        it('should throw error if already executed', () => {
            connectionResponse.accept();
            expect(() => connectionResponse.accept()).toThrow(HttpError);
        });
    });

    describe('decline', () => {
        it('should write error message and destroy socket', () => {
            const writeSpy = jest.spyOn(mockParams.socket, 'write');
            const destroySpy = jest.spyOn(mockParams.socket, 'destroy');

            connectionResponse.decline('Unauthorized', 401);
            expect(writeSpy).toHaveBeenCalledWith('HTTP/1.1 401 Unauthorized\r\n\r\n');
            expect(destroySpy).toHaveBeenCalled();
        });

        it('should throw error if already executed', () => {
            connectionResponse.decline();
            expect(() => connectionResponse.decline()).toThrow(HttpError);
        });
    });

    describe('reply', () => {
        it('should send message to client', () => {
            const mockSocket = new MockWebSocket();

            mockEngine.getUser.mockReturnValue({ socket: mockSocket } as unknown as SocketCache);
            connectionResponse.accept();
            connectionResponse.reply('test-event', { message: 'Hello' });
            expect(mockEngine.sendMessage).toHaveBeenCalledWith(
                mockSocket,
                expect.objectContaining({
                    event: 'test-event',
                    payload: { message: 'Hello' },
                    action: ServerActions.BROADCAST,
                    channelName: SystemSender.ENDPOINT,
                }),
            );
        });

        it('should throw error if not accepted', () => {
            expect(() => connectionResponse.reply('test-event', {})).toThrow(HttpError);
        });
    });
});
