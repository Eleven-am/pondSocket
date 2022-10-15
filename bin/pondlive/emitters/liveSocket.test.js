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
Object.defineProperty(exports, "__esModule", { value: true });
var liveSocket_1 = require("./liveSocket");
var pondsocket_1 = require("../../pondsocket");
var createSocket = function () {
    var manager = {
        handleInfo: jest.fn(),
    };
    var removeDoc = jest.fn();
    var socket = new liveSocket_1.LiveSocket('123', manager, removeDoc);
    return { socket: socket, manager: manager, removeDoc: removeDoc };
};
var createChannel = function () {
    var removeDoc = jest.fn();
    var channel = new pondsocket_1.Channel('TEST', removeDoc);
    return { channel: channel, removeDoc: removeDoc };
};
describe('LiveSocket', function () {
    it('should be able to assign data to a context', function () {
        var socket = createSocket().socket;
        expect(socket.context).toEqual({});
        socket.assign({ test: 'test' });
        expect(socket.context).toEqual({ test: 'test' });
    });
    it('should destroy socket', function () {
        var _a = createSocket(), socket = _a.socket, removeDoc = _a.removeDoc;
        socket.destroy();
        expect(removeDoc).toHaveBeenCalled();
    });
    it('should handle info upgrade to websocket', function () {
        var socket = createSocket().socket;
        var channel = createChannel().channel;
        expect(socket.isWebsocket).toBe(false);
        socket.upgradeToWebsocket(channel);
        expect(socket.isWebsocket).toBe(true);
    });
    it('should handle info downgrade', function () {
        var socket = createSocket().socket;
        var channel = createChannel().channel;
        socket.upgradeToWebsocket(channel);
        expect(socket.isWebsocket).toBe(true);
        socket.downgrade();
        expect(socket.isWebsocket).toBe(false);
    });
    it('should call the managers handle context change when it recieves a message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, socket, manager, channel;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = createSocket(), socket = _a.socket, manager = _a.manager;
                    channel = createChannel().channel;
                    socket.upgradeToWebsocket(channel);
                    // The broadcaster hooks on to the channel and calls the onMessage method
                    return [4 /*yield*/, socket.onMessage({ event: 'test', payload: { test: 'test' } })];
                case 1:
                    // The broadcaster hooks on to the channel and calls the onMessage method
                    _b.sent();
                    expect(manager.handleInfo).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create a response', function () {
        var socket = createSocket().socket;
        // The createResponse method requires the livesocket to be a websocket
        expect(function () { return socket.createResponse(); }).toThrow();
        // This is because the createResponse method creates a pond response
        // This response needs to be able to communicate with the client via the websocket
        // We thus upgrade the socket to a websocket before calling createResponse
        var channel = createChannel().channel;
        socket.upgradeToWebsocket(channel);
        expect(function () { return socket.createResponse(); }).not.toThrow();
        var _a = socket.createResponse(), response = _a.response, router = _a.router;
        expect(response).toBeDefined();
        expect(router).toBeDefined();
    });
    it('should emit an event', function () {
        var socket = createSocket().socket;
        var channel = createChannel().channel;
        // the emit function is only available on a websocket
        // it broadcasts the event to the client
        channel.subscribe(function (data) {
            expect(data.event).toEqual('emit');
            expect(data.payload).toEqual({ event: 'test', data: { test: 'test' } });
        });
        socket.upgradeToWebsocket(channel);
        socket.emit('test', { test: 'test' });
    });
    it('should be capable of taking in subscriptions', function () {
        var _a = createSocket(), socket = _a.socket, removeDoc = _a.removeDoc;
        var channel = createChannel().channel;
        var subscription = {
            unsubscribe: jest.fn(),
        };
        socket.upgradeToWebsocket(channel);
        expect(socket['_subscriptions']).toHaveLength(0);
        // The socket takes in subscriptions and stores them, this subscriptions could be broadcast subscriptions
        // they could also be a context subscription
        // When ever these subjects emit a value, their subscription will be called on the socket
        // The reason we add the subscription to the socket is so that we can unsubscribe from them when the socket is destroyed
        socket.addSubscription(subscription);
        expect(socket['_subscriptions']).toHaveLength(1);
        expect(subscription.unsubscribe).not.toHaveBeenCalled();
        // When the socket is destroyed, it unsubscribes from all of its subscriptions
        socket.destroy();
        expect(subscription.unsubscribe).toHaveBeenCalled();
        // The removeDoc method is also called on the socket
        // this method is used to remove the socket from the manager
        expect(removeDoc).toHaveBeenCalled();
    });
    it('should be able to downgrade', function () {
        var socket = createSocket().socket;
        var channel = createChannel().channel;
        socket.upgradeToWebsocket(channel);
        // The downgrade method unsubscribes from all of the subscriptions
        // it does not remove the socket from the manager
        // This is because the downgrade method is called usually when a component is remounted
        // The socket is not destroyed, it is just downgraded and could be upgraded again
        // The subscriptions are cleared because the component is remounted and the subscriptions are no longer valid
        var subscription = {
            unsubscribe: jest.fn(),
        };
        socket.addSubscription(subscription);
        expect(socket['_subscriptions']).toHaveLength(1);
        expect(subscription.unsubscribe).not.toHaveBeenCalled();
        socket.downgrade();
        expect(subscription.unsubscribe).toHaveBeenCalled();
        expect(socket['_subscriptions']).toHaveLength(0);
    });
});
