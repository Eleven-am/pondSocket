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
const createPondSocket = () => {
    const mock = jest.fn();
    const socket = new pondSocket_1.PondSocket();
    const server = socket.listen(3001, mock);
    return { socket, server, mock };
};
describe('endpoint', () => {
    it('should be defined', () => {
        expect(endpoint_1.Endpoint).toBeDefined();
    });
    it('should be instantiable', () => {
        const socketServer = {};
        const handler = jest.fn();
        expect(new endpoint_1.Endpoint(socketServer, handler)).toBeInstanceOf(endpoint_1.Endpoint);
    });
    // Functionality tests
    it('should be able to close a socket', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            res.accept();
            setTimeout(() => {
                endpoint.closeConnection(req.clientId);
            }, 100);
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .wait(200)
            .expectClosed();
        server.close();
    }));
    it('should be able to list connections', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
        let connectionsCount = 0;
        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:path', (req, res) => {
            expect(req.params.path).toBe('socket');
            connectionsCount = endpoint.listConnections().length;
            res.accept();
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101));
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101));
        server.close(); // Close the server to stop the connection from being kept alive
        expect(connectionsCount).toBe(1);
        expect(endpoint.listConnections().length).toBe(2); // The connections are still in the list
    }));
    it('should be capable of sending messages to all clients', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
        expect(server).toBeDefined();
        let users = 0;
        const endpoint = socket.createEndpoint('/api/:room', (req, res) => {
            users++;
            res.send('Hello', { room: req.params.room });
            if (users > 0)
                endpoint.broadcast('TEST', { message: 'Hello everyone' });
        });
        yield (0, superwstest_1.default)(server)
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
        yield (0, superwstest_1.default)(server)
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
    }));
    it('should be able to accept connections on this handler', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
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
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson(); // receives a presence message, this can not be matched because the payload is dynamic
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(Object.assign(Object.assign({}, message), { channelName: '/socket/socket' }))
            .expectJson(); // receives a presence message, this can not be matched because the payload is dynamic
        expect([...endpoint['_channels'].generator()]).toHaveLength(2);
        server.close();
    }));
    it('should refuse connections if there are no handlers', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
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
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson(); // receives a presence message, this can not be matched because the payload is dynamic
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(Object.assign(Object.assign({}, message), { channelName: '/socket/socket' // This channel handler does not exist
         }))
            .expectJson(); // receives a presence message, this can not be matched because the payload is dynamic
        expect([...endpoint['_channels'].generator()]).toHaveLength(1);
        server.close();
    }));
    it('should send an error when we send an incomplete message', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
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
        const message = {
            action: enums_1.ClientActions.LEAVE_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "Channel /test/socket does not exist"
            }
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(Object.assign(Object.assign({}, message), { action: null }))
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "No action provided",
            }
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.BROADCAST, channelName: null }))
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "No channel name provided",
            }
        });
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.BROADCAST_FROM, payload: null }))
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "No payload provided",
            }
        });
        // send incorrect Json message
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .send('"action": "JOIN_CHANNEL", "channelName": "/test/socket", "event": "TEST", "payload": {}}')
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "Invalid JSON",
            }
        });
        expect([...endpoint['_channels'].generator()]).toHaveLength(1);
        server.close();
    }));
    it('should send an error when the channel exists but other things happen', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
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
            }
            else if (req.params.room === 'TEST2') {
                res.reject();
            }
            else if (req.params.room === 'TEST3') {
                res.reject('choke on my balls');
            }
            else
                res.reject('TEST');
        });
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson(Object.assign(Object.assign({}, message), { event: '/test/TEST2', action: enums_1.ClientActions.BROADCAST }))
            .expectJson({
            action: "ERROR", event: "error", channelName: "/test/socket", payload: {
                message: "Message rejected", code: 403
            }
        })
            .sendJson(Object.assign(Object.assign({}, message), { channelName: "/test/socket", action: enums_1.ClientActions.BROADCAST }))
            .expectJson({
            action: enums_1.ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
        })
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.SEND_MESSAGE_TO_USER }))
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "Error while executing event 'TEST' on channel '/test/socket': No addresses provided"
            }
        });
        expect(endpoint.listChannels()).toHaveLength(1);
        server.close();
    }));
    it('should be capable of sending messages to a specific user', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
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
            }
            else if (req.params.room === 'TEST2') {
                res.reject();
            }
            else if (req.params.room === 'TEST3') {
                res.reject('choke on my balls');
            }
            else
                res.reject('TEST');
        });
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.BROADCAST_FROM, payload: {
                message: {
                    action: enums_1.ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                }
            } }));
        expect(endpoint.listChannels()).toHaveLength(1);
        server.close();
    }));
    it('should be able to update user presence on user demand', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });
        endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept();
        });
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.UPDATE_PRESENCE, payload: {
                presence: {
                    status: 'online'
                }
            } }))
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.SEND_MESSAGE_TO_USER, addresses: [], payload: {} }))
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "Error while executing event 'TEST' on channel '/test/socket': No addresses provided"
            }
        })
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.SEND_MESSAGE_TO_USER, addresses: ['hello'], payload: {} }))
            .expectJson({
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: "Error while executing event 'TEST' on channel '/test/socket': Client(s) with clientId(s) hello were not found in channel /test/socket"
            }
        })
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.UPDATE_PRESENCE, payload: {
                assigns: {
                    status: 'online'
                }
            } }))
            .close()
            .expectClosed();
        expect(endpoint.listChannels()).toHaveLength(1); // the channel has not been removed yet
        yield (0, superwstest_1.default)(server)
            .ws('/api/newSocket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(Object.assign(Object.assign({}, message), { channelName: '/test/socket2' }))
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.LEAVE_CHANNEL, channelName: '/test/socket2' }))
            .expectJson();
        expect(endpoint.listChannels()).toHaveLength(0); // by now the first channel should have been removed; and since we gracefully closed the connection, the second channel should have been removed as well
        server.close();
    }));
    it('should ba able to send messages to a specific user', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
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
                endpoint.send(req.client.clientId, 'Test', { message: 'hello' });
                res.accept();
            }
        });
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        yield (0, superwstest_1.default)(server)
            .ws('/api/socket')
            .expectUpgrade(res => expect(res.statusCode).toBe(101))
            .sendJson(message)
            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
            .sendJson(Object.assign(Object.assign({}, message), { action: enums_1.ClientActions.BROADCAST_FROM, payload: {
                message: {
                    action: enums_1.ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                }
            } })).expectJson({
            action: enums_1.ServerActions.MESSAGE,
            event: 'Test', channelName: enums_1.PondSenders.ENDPOINT,
            payload: {
                message: 'hello'
            }
        });
        expect(endpoint.listChannels()).toHaveLength(1);
        server.close();
    }));
    it('should be able ot manage error from the client side', () => __awaiter(void 0, void 0, void 0, function* () {
        const { socket, server } = createPondSocket();
        expect(server).toBeDefined();
        const endpoint = socket.createEndpoint('/api/:room', (_, res) => {
            res.accept();
        });
        const channel = endpoint.createChannel('/test/:room', (req, res, _) => {
            expect(req.params.room).toBeDefined();
            res.accept();
        });
        channel.on(':room', (req, res) => {
            if (req.params.room === 'TEST') {
                res.reject('TEST');
            }
        });
        const message = {
            action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
        };
        const functionToTest = (ws) => {
            try {
                ws.emit('error', {});
            }
            catch (e) {
                console.log(e);
            }
        };
        try {
            yield (0, superwstest_1.default)(server)
                .ws('/api/socket')
                .expectUpgrade(res => expect(res.statusCode).toBe(101))
                .sendJson(message)
                .exec(functionToTest)
                .expectClosed();
        }
        catch (e) {
            console.log(e);
        }
        expect(endpoint.listChannels()).toHaveLength(0); // the socket should have been removed
        expect(endpoint['_findChannel']('/test/socket')).toBeUndefined();
        server.close();
    }));
});
