"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var endpoint_1 = require("./endpoint");
var pondSocket_1 = require("./pondSocket");
var superwstest_1 = __importDefault(require("superwstest"));
var enums_1 = require("./enums");
describe('endpoint', function () {
    it('should be defined', function () {
        expect(endpoint_1.Endpoint).toBeDefined();
    });
    it('should be instantiable', function () {
        var socketServer = {};
        expect(new endpoint_1.Endpoint(socketServer, function () {
        })).toBeInstanceOf(endpoint_1.Endpoint);
    });
    it('should have a createChannel method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.createChannel).toBeDefined();
    });
    it('should have an authoriseConnection method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.authoriseConnection).toBeDefined();
    });
    it('should have a closeConnection method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.closeConnection).toBeDefined();
    });
    it('should have a listChannels method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.listChannels).toBeDefined();
    });
    it('should have a send method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.send).toBeDefined();
    });
    it('should have a broadcast method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.broadcast).toBeDefined();
    });
    it('should have a listConnections method', function () {
        var socketServer = {};
        var endpoint = new endpoint_1.Endpoint(socketServer, function () {
        });
        expect(endpoint.listConnections).toBeDefined();
    });
    // Functionality tests
    it('should be able to close a socket', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:path', function (req, res) {
                        expect(req.params.path).toBe('socket');
                        res.accept();
                        setTimeout(function () {
                            endpoint.closeConnection(req.clientId);
                        }, 100);
                    });
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .wait(200)
                            .expectClosed()];
                case 1:
                    _a.sent();
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be able to list connections', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, connectionsCount, server, endpoint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    connectionsCount = 0;
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:path', function (req, res) {
                        expect(req.params.path).toBe('socket');
                        connectionsCount = endpoint.listConnections().length;
                        res.accept();
                    });
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })];
                case 2:
                    _a.sent();
                    server.close(); // Close the server to stop the connection from being kept alive
                    expect(connectionsCount).toBe(2);
                    expect(endpoint.listConnections().length).toBe(2); // Should be 0 but it remains 2 because the tests are not waiting for the server to close
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be capable of sending messages to all clients', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, users, endpoint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    users = 0;
                    endpoint = socket.createEndpoint('/api/:room', function (req, res) {
                        users++;
                        res.send('Hello', { room: req.params.room });
                        if (users > 0)
                            endpoint.broadcast('TEST', { message: 'Hello everyone' });
                    });
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .expectJson({
                            action: 'MESSAGE', event: 'Hello', channelName: 'SERVER', payload: {
                                room: 'socket'
                            }
                        })
                            .expectJson({
                            action: 'MESSAGE', event: 'TEST', channelName: "ENDPOINT", payload: {
                                message: 'Hello everyone'
                            }
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/secondSocket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .expectJson({
                            action: 'MESSAGE', event: 'Hello', channelName: 'SERVER', payload: {
                                room: 'secondSocket'
                            }
                        })
                            .expectJson({
                            action: 'MESSAGE', event: 'TEST', channelName: 'ENDPOINT', payload: {
                                message: 'Hello everyone'
                            }
                        })];
                case 2:
                    _a.sent();
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be able to accept connections on this handler', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept({
                            presence: {
                                status: 'online',
                            }
                        });
                    });
                    endpoint.createChannel('/socket/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept({
                            presence: {
                                status: 'online socket',
                            }
                        });
                    });
                    message = {
                        action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson()]; // receives a presence message, this can not be matched because the payload is dynamic
                case 1:
                    _a.sent(); // receives a presence message, this can not be matched because the payload is dynamic
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(__assign(__assign({}, message), { channelName: '/socket/socket' }))
                            .expectJson()]; // receives a presence message, this can not be matched because the payload is dynamic
                case 2:
                    _a.sent(); // receives a presence message, this can not be matched because the payload is dynamic
                    expect(endpoint['_channels'].toArray()).toHaveLength(2);
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should refuse connections if there are no handlers', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept({
                            presence: {
                                status: 'online',
                            }
                        });
                    });
                    message = {
                        action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson()]; // receives a presence message, this can not be matched because the payload is dynamic
                case 1:
                    _a.sent(); // receives a presence message, this can not be matched because the payload is dynamic
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(__assign(__assign({}, message), { channelName: '/socket/socket' // This channel handler does not exist
                         }))
                            .expectJson()]; // receives a presence message, this can not be matched because the payload is dynamic
                case 2:
                    _a.sent(); // receives a presence message, this can not be matched because the payload is dynamic
                    expect(endpoint['_channels'].toArray()).toHaveLength(1);
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send an error when we send an incomplete message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept({
                            presence: {
                                status: 'online',
                            }
                        });
                    });
                    message = {
                        action: enums_1.ClientActions.LEAVE_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson({
                            action: "ERROR", event: "LEAVE_CHANNEL", channelName: "/test/socket", payload: {
                                message: "Channel not found", code: 404
                            }
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(__assign(__assign({}, message), { action: null }))
                            .expectJson({
                            action: "ERROR", event: "INVALID_MESSAGE", channelName: enums_1.PondSenders.ENDPOINT, payload: {
                                message: "No action provided",
                            }
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.BROADCAST, channelName: null }))
                            .expectJson({
                            action: "ERROR", event: "INVALID_MESSAGE", channelName: enums_1.PondSenders.ENDPOINT, payload: {
                                message: "No channel name provided",
                            }
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.BROADCAST_FROM, payload: null }))
                            .expectJson({
                            action: "ERROR", event: "INVALID_MESSAGE", channelName: enums_1.PondSenders.ENDPOINT, payload: {
                                message: "No payload provided",
                            }
                        })];
                case 4:
                    _a.sent();
                    // send incorrect Json message
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .send('"action": "JOIN_CHANNEL", "channelName": "/test/socket", "event": "TEST", "payload": {}}')
                            .expectJson({
                            action: "ERROR", event: "INVALID_MESSAGE", channelName: enums_1.PondSenders.ENDPOINT, payload: {
                                message: "Invalid message",
                            }
                        })];
                case 5:
                    // send incorrect Json message
                    _a.sent();
                    expect(endpoint['_channels'].toArray()).toHaveLength(1);
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send an error when the channel exists but other things happen', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, channel, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3005, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    channel = endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept();
                    });
                    channel.on('/test/:room', function (req, res, _) {
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
                    message = {
                        action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
                            .sendJson(__assign(__assign({}, message), { event: '/test/TEST2', action: enums_1.ClientActions.BROADCAST }))
                            .expectJson({
                            action: "ERROR", event: "/test/TEST2", channelName: "/test/socket", payload: {
                                message: "Message rejected", code: 403
                            }
                        })
                            .sendJson(__assign(__assign({}, message), { channelName: "/test/socket", action: enums_1.ClientActions.BROADCAST }))
                            .expectJson({
                            action: enums_1.ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                        })
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.SEND_MESSAGE_TO_USER }))
                            .expectJson({
                            action: "ERROR", event: "TEST", channelName: "/test/socket", payload: {
                                message: "No addresses provided", code: 400
                            }
                        })];
                case 1:
                    _a.sent();
                    expect(endpoint.listChannels()).toHaveLength(1);
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be capable of sending messages to a specific user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, channel, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3006, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    channel = endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept();
                    });
                    channel.on('/test/:room', function (req, res, _) {
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
                    message = {
                        action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.BROADCAST_FROM, payload: {
                                message: {
                                    action: enums_1.ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                                }
                            } }))];
                case 1:
                    _a.sent();
                    expect(endpoint.listChannels()).toHaveLength(1);
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be able to update user presence on user demand', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3005, function () {
                    });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept();
                    });
                    message = {
                        action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.UPDATE_PRESENCE, payload: {
                                presence: {
                                    status: 'online'
                                }
                            } }))
                            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.SEND_MESSAGE_TO_USER, addresses: [], payload: {} }))
                            .expectJson({
                            action: "ERROR", event: "TEST", channelName: "/test/socket", payload: {
                                message: "No addresses provided", code: 400
                            }
                        })
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.SEND_MESSAGE_TO_USER, addresses: ['hello'], payload: {} }))
                            .expectJson({
                            action: "ERROR", event: "INVALID_MESSAGE", channelName: "END_POINT", payload: {
                                message: "Recipient not found", code: 5002, data: ['hello']
                            }
                        })
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.UPDATE_PRESENCE, payload: {
                                assigns: {
                                    status: 'online'
                                }
                            } }))
                            .close()
                            .expectClosed()];
                case 1:
                    _a.sent();
                    expect(endpoint.listChannels()).toHaveLength(1); // the channel has not been removed yet
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/newSocket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(__assign(__assign({}, message), { channelName: '/test/socket2' }))
                            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.LEAVE_CHANNEL, channelName: '/test/socket2' }))
                            .expectJson()];
                case 2:
                    _a.sent();
                    expect(endpoint.listChannels()).toHaveLength(0); // by now the first channel should have been removed; and since we gracefully closed the connection, the second channel should have been removed as well
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should ba able to send messages to a specific user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server, endpoint, channel, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3004, function () { });
                    expect(server).toBeDefined();
                    endpoint = socket.createEndpoint('/api/:room', function (_, res) {
                        res.accept();
                    });
                    channel = endpoint.createChannel('/test/:room', function (req, res, _) {
                        expect(req.params.room).toBeDefined();
                        res.accept();
                    });
                    channel.on(':room', function (req, res, _) {
                        if (req.params.room === 'TEST') {
                            endpoint.send(req.client.clientId, 'Test', { message: 'hello' });
                            res.accept();
                        }
                    });
                    message = {
                        action: enums_1.ClientActions.JOIN_CHANNEL, channelName: '/test/socket', event: 'TEST', payload: {}
                    };
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .sendJson(message)
                            .expectJson() // receives a presence message, this can not be matched because the payload is dynamic
                            .sendJson(__assign(__assign({}, message), { action: enums_1.ClientActions.BROADCAST_FROM, payload: {
                                message: {
                                    action: enums_1.ServerActions.MESSAGE, payload: {}, event: "TEST", channelName: "/test/socket"
                                }
                            } })).expectJson({
                            action: enums_1.ServerActions.MESSAGE,
                            event: 'Test', channelName: enums_1.PondSenders.ENDPOINT,
                            payload: {
                                message: 'hello'
                            }
                        })];
                case 1:
                    _a.sent();
                    expect(endpoint.listChannels()).toHaveLength(1);
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
});
