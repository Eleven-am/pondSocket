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
var pondBase_1 = require("../pondBase");
var endpoint_1 = require("./endpoint");
var pondSocket_1 = require("./pondSocket");
var superwstest_1 = __importDefault(require("superwstest"));
var enums_1 = require("./enums");
describe('server', function () {
    it('should be defined', function () {
        expect(pondSocket_1.PondSocket).toBeDefined();
    });
    it('should be instantiable', function () {
        expect(new pondSocket_1.PondSocket()).toBeInstanceOf(pondSocket_1.PondSocket);
    });
    it('should ba able to create its own server and websocket server if none is provided', function () {
        var socket = new pondSocket_1.PondSocket();
        expect(socket['_server']).toBeDefined();
        expect(socket['_socketServer']).toBeDefined();
    });
    it('should take a server and websocket server if provided', function () {
        var server = require('http').createServer();
        var socketServer = require('ws').Server;
        var socket = new pondSocket_1.PondSocket(server, socketServer);
        expect(socket['_server']).toBe(server);
        expect(socket['_socketServer']).toBe(socketServer);
    });
    it('should be able to listen on a port', function () {
        var socket = new pondSocket_1.PondSocket();
        expect(socket.listen(3001, function () {
        })).toBeDefined();
        socket['_server'].close();
    });
    it('should be able to create an endpoint', function () {
        var socket = new pondSocket_1.PondSocket();
        var endpoint = socket.createEndpoint('/api/socket', function () {
        });
        expect(endpoint).toBeInstanceOf(endpoint_1.Endpoint);
        expect(endpoint['_handler']).toEqual(expect.any(Function));
    });
    it('should be able to create multiple endpoints', function () {
        var socket = new pondSocket_1.PondSocket();
        var endpoint = socket.createEndpoint('/api/socket', function () {
        });
        var endpoint2 = socket.createEndpoint('/api/socket2', function () {
        });
        expect(endpoint).toBeInstanceOf(endpoint_1.Endpoint);
        expect(endpoint['_handler']).toEqual(expect.any(Function));
        expect(endpoint2).toBeInstanceOf(endpoint_1.Endpoint);
        expect(endpoint2['_handler']).toEqual(expect.any(Function));
    });
    it('should throw an error when the server throws an error', function () {
        var server = require('http').createServer();
        var socket = new pondSocket_1.PondSocket(server);
        socket.listen(3001, function () {
        });
        expect(function () { return server.emit('error', new Error('test')); }).toThrowError(pondBase_1.PondError);
        server.close();
    });
    it('should be able to reject a socket', function () {
        var server = require('http').createServer();
        var socketServer = require('ws').Server;
        var socket = new pondSocket_1.PondSocket(server, socketServer);
        var socketClient = {
            write: jest.fn(),
            destroy: jest.fn(),
        };
        socket.listen(3001, function () {
        });
        server.emit('upgrade', {}, socketClient);
        server.close();
        // these functions are called because there is no endpoint to accept the socket
        expect(socketClient.write).toHaveBeenCalled();
        expect(socketClient.destroy).toHaveBeenCalled();
    });
    it('should be able to accept a socket if a handler is provided', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    socket.createEndpoint('/api/hello', function () {
                    });
                    socket.createEndpoint('/api/:path', function (req, res) {
                        expect(req.params.path).toBe('socket');
                        res.accept();
                    });
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .close()
                            .expectClosed()];
                case 1:
                    _a.sent();
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be able to reject a socket if the handler rejects', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    socket.createEndpoint('/api/:path', function (req, res) {
                        expect(req.params.path).toBe('socket');
                        res.reject();
                    });
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectConnectionError()];
                case 1:
                    _a.sent();
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be able to send a message after connection', function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, server;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = new pondSocket_1.PondSocket();
                    server = socket.listen(3001, function () {
                    });
                    expect(server).toBeDefined();
                    socket.createEndpoint('/api/:path', function (req, res) {
                        expect(req.params.path).toBe('socket');
                        res.send('testEvent', { test: 'test' });
                    });
                    return [4 /*yield*/, (0, superwstest_1.default)(server)
                            .ws('/api/socket')
                            .expectUpgrade(function (res) { return expect(res.statusCode).toBe(101); })
                            .expectJson({
                            action: enums_1.ServerActions.MESSAGE,
                            event: 'testEvent',
                            channelName: 'SERVER',
                            payload: { test: 'test' },
                        })
                            .close()
                            .expectClosed()];
                case 1:
                    _a.sent();
                    server.close();
                    return [2 /*return*/];
            }
        });
    }); });
});
