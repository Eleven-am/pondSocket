"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const endpoint_1 = require("./endpoint");
const pondSocket_1 = require("./pondSocket");
const superwstest_1 = __importDefault(require("superwstest"));
const enums_1 = require("./enums");
const http_1 = require("http");
const ws_1 = require("ws");
describe('server', () => {
    it('should be defined', () => {
        expect(pondSocket_1.PondSocket).toBeDefined();
    });
    it('should be instantiable', () => {
        expect(new pondSocket_1.PondSocket()).toBeInstanceOf(pondSocket_1.PondSocket);
    });
    it('should ba able to create its own server and websocket server if none is provided', () => {
        const socket = new pondSocket_1.PondSocket();
        expect(socket['_server']).toBeDefined();
        expect(socket['_socketServer']).toBeDefined();
    });
    it('should take a server and websocket server if provided', () => {
        const server = (0, http_1.createServer)();
        const socketServer = new ws_1.Server({ noServer: true });
        const socket = new pondSocket_1.PondSocket(server, socketServer);
        expect(socket['_server']).toBe(server);
        expect(socket['_socketServer']).toBe(socketServer);
    });
    it('should be able to listen on a port', () => {
        const socket = new pondSocket_1.PondSocket();
        expect(socket.listen(3001, () => {
            console.log('socket');
        })).toBeDefined();
        socket['_server'].close();
    });
    it('should be able to create an endpoint', () => {
        const socket = new pondSocket_1.PondSocket();
        const endpoint = socket.createEndpoint('/api/socket', () => {
            console.log('socket');
        });
        expect(endpoint).toBeInstanceOf(endpoint_1.Endpoint);
        expect(endpoint['_handler']).toEqual(expect.any(Function));
    });
    it('should be able to create multiple endpoints', () => {
        const server = (0, http_1.createServer)();
        const socketServer = new ws_1.Server({ noServer: true });
        const socket = new pondSocket_1.PondSocket(server, socketServer);
        const endpoint = socket.createEndpoint('/api/socket', () => {
            console.log('socket');
        });
        const endpoint2 = socket.createEndpoint('/api/socket2', () => {
            console.log('socket2');
        });
        expect(endpoint).toBeInstanceOf(endpoint_1.Endpoint);
        expect(endpoint['_handler']).toEqual(expect.any(Function));
        expect(endpoint2).toBeInstanceOf(endpoint_1.Endpoint);
        expect(endpoint2['_handler']).toEqual(expect.any(Function));
    });
    it('should be able to reject a socket', () => {
        const server = (0, http_1.createServer)();
        const socketServer = new ws_1.Server({ noServer: true });
        const socket = new pondSocket_1.PondSocket(server, socketServer);
        const socketClient = {
            write: jest.fn(),
            destroy: jest.fn(),
        };
        socket.listen(3001, () => {
            console.log('server listening');
        });
        server.emit('upgrade', {}, socketClient);
        server.close();
        // these functions are called because there is no endpoint to accept the socket
        expect(socketClient.write).toHaveBeenCalled();
        expect(socketClient.destroy).toHaveBeenCalled();
    });
    it('should be able to accept a socket if a handler is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const socket = new pondSocket_1.PondSocket();
        const server = socket.listen(3001, () => {
            console.log('server listening');
        });
        expect(server).toBeDefined();
        socket.createEndpoint('/api/hello', () => {
            console.log('server listening');
        });
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.accept();
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .close()
            .expectClosed();
        server.close();
    }));
    it('should be able to reject a socket if the handler rejects', () => __awaiter(void 0, void 0, void 0, function* () {
        const socket = new pondSocket_1.PondSocket();
        const server = socket.listen(3001, () => {
            console.log('server listening');
        });
        expect(server).toBeDefined();
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.reject();
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectConnectionError();
        server.close();
    }));
    it('should be able to send a message after connection', () => __awaiter(void 0, void 0, void 0, function* () {
        const socket = new pondSocket_1.PondSocket();
        const server = socket.listen(3001, () => {
            console.log('server listening');
        });
        expect(server).toBeDefined();
        socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.send('testEvent', { test: 'test' });
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .expectJson({
            action: enums_1.ServerActions.MESSAGE,
            event: 'testEvent',
            channelName: 'SERVER',
            payload: { test: 'test' },
        })
            .close()
            .expectClosed();
        server.close();
    }));
});
