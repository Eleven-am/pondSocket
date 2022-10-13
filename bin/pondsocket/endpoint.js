"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = void 0;
var enums_1 = require("./enums");
var pondbase_1 = require("../pondbase");
var pondChannel_1 = require("./pondChannel");
var pondResponse_1 = require("./pondResponse");
var Endpoint = /** @class */ (function (_super) {
    __extends(Endpoint, _super);
    function Endpoint(server, handler) {
        var _this = _super.call(this) || this;
        _this._channels = new pondbase_1.PondBase();
        _this._sockets = new pondbase_1.PondBase();
        _this._handler = handler;
        _this._server = server;
        return _this;
    }
    /**
     * @desc Sends a message to a client
     * @param socket - The socket to send the message to
     * @param message - The message to send
     */
    Endpoint._sendMessage = function (socket, message) {
        socket.send(JSON.stringify(message));
    };
    /**
     * @desc Accepts a new socket join request to the room provided using the handler function to authorise the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     *
     * @example
     * const channel = endpoint.createChannel('channel:*', (req, res) => {
     *   const isAdmin = req.clientAssigns.admin;
     *   if (!isAdmin)
     *      return res.reject("You are not an admin");
     *
     *   res.accept({
     *      assign: {
     *         admin: true,
     *         joinedDate: new Date()
     *      },
     *      presence: {state: 'online'},
     *      channelData: {private: true}
     *   });
     * });
     *
     * channel.on('ping', (req, res, channel) => {
     *     const users = channel.getPresence();
     *     res.assign({
     *        assign: {
     *           pingDate: new Date(),
     *           users: users.length
     *        }
     *    });
     * })
     */
    Endpoint.prototype.createChannel = function (path, handler) {
        var pondChannel = new pondChannel_1.PondChannel(path, handler);
        this._channels.set(pondChannel);
        return pondChannel;
    };
    /**
     * @desc Authenticates the client to the endpoint
     * @param request - Incoming request
     * @param socket - Incoming socket
     * @param head - Incoming head
     * @param data - Incoming the data resolved from the handler
     */
    Endpoint.prototype.authoriseConnection = function (request, socket, head, data) {
        var _this = this;
        return (0, pondbase_1.BasePromise)(socket, function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var assign, doc, req, resolver, res;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assign = {
                            assigns: {}, presence: {}, channelData: {}
                        };
                        doc = this._sockets.set({});
                        req = __assign(__assign({ headers: request.headers }, data), { clientId: doc.id });
                        resolver = function (data) {
                            if (data.error) {
                                doc.removeDoc();
                                return reject(data.error.errorMessage, data.error.errorCode);
                            }
                            _this._server.handleUpgrade(request, socket, head, function (ws) {
                                _this._server.emit("connection", ws);
                                var socketCache = {
                                    socket: ws, assigns: data.assigns.assigns
                                };
                                doc.updateDoc(socketCache);
                                _this._manageSocket(doc);
                                if (data.message) {
                                    var newMessage = {
                                        action: enums_1.ServerActions.MESSAGE,
                                        event: data.message.event,
                                        channelName: "SERVER",
                                        payload: data.message.payload
                                    };
                                    Endpoint._sendMessage(ws, newMessage);
                                }
                                resolve();
                            });
                        };
                        res = new pondResponse_1.PondResponse(socket, assign, resolver, false);
                        return [4 /*yield*/, this._handler(req, res, this)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * @desc Closes a client connection to the endpoint.
     * @param clientId - The id of the client to close the connection to.
     */
    Endpoint.prototype.closeConnection = function (clientId) {
        var message = {
            action: enums_1.ServerActions.CLOSE, channelName: "SERVER", event: "CLOSED_FROM_SERVER", payload: {}
        };
        var stringifiedMessage = JSON.stringify(message);
        var socketDoc = this._sockets.get(clientId);
        if (socketDoc) {
            socketDoc.doc.socket.send(stringifiedMessage);
            socketDoc.doc.socket.close();
            socketDoc.removeDoc();
        }
    };
    /**
     * @desc Sends a message to a client on the endpoint.
     * @param clientId - The id of the client to send the message to.
     * @param event - The event to send the message with.
     * @param message - The message to send.
     */
    Endpoint.prototype.send = function (clientId, event, message) {
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, channelName: enums_1.PondSenders.ENDPOINT,
            event: event,
            payload: message
        };
        var stringifiedMessage = JSON.stringify(newMessage);
        var addresses = Array.isArray(clientId) ? clientId : [clientId];
        this._sockets.queryByKeys(addresses)
            .forEach(function (client) { return client.doc.socket.send(stringifiedMessage); });
    };
    /**
     * @desc lists all the channels in the endpoint
     */
    Endpoint.prototype.listChannels = function () {
        return this._channels.map(function (channel) { return channel.info; }).flat();
    };
    /**
     * @desc lists all the clients in the endpoint
     */
    Endpoint.prototype.listConnections = function () {
        return this._sockets.map(function (socket) { return socket.socket; });
    };
    /**
     * @desc Broadcasts a message to all clients in the endpoint.
     * @param event - The event to broadcast.
     * @param message - The message to broadcast.
     */
    Endpoint.prototype.broadcast = function (event, message) {
        var sockets = __spreadArray([], __read(this._sockets.generate()), false);
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, channelName: enums_1.PondSenders.ENDPOINT,
            event: event,
            payload: message
        };
        var stringifiedMessage = JSON.stringify(newMessage);
        sockets.forEach(function (socket) { return socket.socket.send(stringifiedMessage); });
    };
    /**
     * @desc Searches for a channel in the endpoint.
     * @param name - The name of the channel to search for.
     */
    Endpoint.prototype._findChannel = function (name) {
        var pond = this._findPondChannel(name);
        if (pond) {
            var channel = pond.doc.findChannel(function (channel) { return channel.name === name; });
            if (channel)
                return channel;
        }
        return undefined;
    };
    /**
     * @desc Manages a new socket connection
     * @param cache - The socket cache
     * @private
     */
    Endpoint.prototype._manageSocket = function (cache) {
        var _this = this;
        var socket = cache.doc.socket;
        socket.addEventListener("message", function (message) { return _this._readMessage(cache, message.data); });
        socket.addEventListener("close", function () {
            var e_1, _a;
            try {
                for (var _b = __values(_this._channels.generate()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var channel = _c.value;
                    channel.removeUser(cache.id);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            cache.removeDoc();
        });
        socket.addEventListener("error", function () {
            var e_2, _a;
            try {
                for (var _b = __values(_this._channels.generate()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var channel = _c.value;
                    channel.removeUser(cache.id);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            cache.removeDoc();
        });
    };
    /**
     * @desc Finds a pond channel in the endpoint.
     * @param channelName - The name of the channel to find.
     * @private
     */
    Endpoint.prototype._findPondChannel = function (channelName) {
        var _this = this;
        return this._channels.find(function (channel) { return _this.generateEventRequest(channel.path, channelName) !== null; });
    };
    /**
     * @desc Handles a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     * @private
     */
    Endpoint.prototype._readMessage = function (cache, message) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var errorMessage, data, e_3, message_1, message_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        errorMessage = {
                            action: enums_1.ServerActions.ERROR, event: "INVALID_MESSAGE", channelName: enums_1.PondSenders.ENDPOINT, payload: {}
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 7, , 8]);
                        data = JSON.parse(message);
                        if (!!data.action) return [3 /*break*/, 2];
                        errorMessage.payload = {
                            message: "No action provided"
                        };
                        return [3 /*break*/, 6];
                    case 2:
                        if (!!data.channelName) return [3 /*break*/, 3];
                        errorMessage.payload = {
                            message: "No channel name provided"
                        };
                        return [3 /*break*/, 6];
                    case 3:
                        if (!!data.payload) return [3 /*break*/, 4];
                        errorMessage.payload = {
                            message: "No payload provided"
                        };
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this._handleMessage(cache, data)];
                    case 5:
                        _c.sent();
                        _c.label = 6;
                    case 6:
                        if (!this.isObjectEmpty(errorMessage.payload))
                            Endpoint._sendMessage(cache.doc.socket, errorMessage);
                        return [3 /*break*/, 8];
                    case 7:
                        e_3 = _c.sent();
                        if (e_3 instanceof SyntaxError) {
                            message_1 = {
                                action: enums_1.ServerActions.ERROR, event: "INVALID_MESSAGE", channelName: enums_1.PondSenders.ENDPOINT, payload: {
                                    message: "Invalid message"
                                }
                            };
                            Endpoint._sendMessage(cache.doc.socket, message_1);
                        }
                        else if (e_3 instanceof pondbase_1.PondError) {
                            message_2 = {
                                action: enums_1.ServerActions.ERROR,
                                event: ((_a = e_3.data) === null || _a === void 0 ? void 0 : _a.event) || "INVALID_MESSAGE",
                                channelName: ((_b = e_3.data) === null || _b === void 0 ? void 0 : _b.channelName) || "END_POINT",
                                payload: {
                                    message: e_3.errorMessage, code: e_3.errorCode, data: e_3.data.event ? undefined : e_3.data
                                }
                            };
                            Endpoint._sendMessage(cache.doc.socket, message_2);
                        }
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc Deals with a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     */
    Endpoint.prototype._handleMessage = function (cache, message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pond, user;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = message.action;
                        switch (_a) {
                            case "JOIN_CHANNEL": return [3 /*break*/, 1];
                            case "LEAVE_CHANNEL": return [3 /*break*/, 5];
                            case "BROADCAST_FROM": return [3 /*break*/, 7];
                            case "BROADCAST": return [3 /*break*/, 9];
                            case "SEND_MESSAGE_TO_USER": return [3 /*break*/, 11];
                            case "UPDATE_PRESENCE": return [3 /*break*/, 13];
                        }
                        return [3 /*break*/, 15];
                    case 1:
                        pond = this._findPondChannel(message.channelName);
                        if (!pond) return [3 /*break*/, 3];
                        user = {
                            clientId: cache.id, socket: cache.doc.socket, assigns: cache.doc.assigns
                        };
                        return [4 /*yield*/, pond.doc.addUser(user, message.channelName, message.payload)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3: throw new pondbase_1.PondError("The channel was not found", 4004, {
                        channelName: message.channelName, event: "JOIN_CHANNEL"
                    });
                    case 4: return [3 /*break*/, 15];
                    case 5: return [4 /*yield*/, this._channelAction(message.channelName, "LEAVE_CHANNEL", function (channel) {
                            channel.removeUser(cache.id);
                        })];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 7: return [4 /*yield*/, this._channelAction(message.channelName, message.event, function (channel) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, channel.broadcastFrom(message.event, message.payload, cache.id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 9: return [4 /*yield*/, this._channelAction(message.channelName, message.event, function (channel) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                channel.broadcast(message.event, message.payload, cache.id);
                                return [2 /*return*/];
                            });
                        }); })];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 11: return [4 /*yield*/, this._channelAction(message.channelName, message.event, function (channel) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (!message.addresses || message.addresses.length === 0)
                                    throw new pondbase_1.PondError("No addresses provided", 400, {
                                        event: message.event, channelName: message.channelName
                                    });
                                channel.sendTo(message.event, message.payload, cache.id, message.addresses);
                                return [2 /*return*/];
                            });
                        }); })];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 13: return [4 /*yield*/, this._channelAction(message.channelName, "UPDATE_PRESENCE", function (channel) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, channel.updateUser(cache.id, ((_a = message.payload) === null || _a === void 0 ? void 0 : _a.presence) || {}, ((_b = message.payload) === null || _b === void 0 ? void 0 : _b.assigns) || {})];
                                    case 1:
                                        _c.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 14:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc Handles a channel action by finding the channel and executing the callback.
     * @param channelName - The name of the channel to find.
     * @param event - The event to execute.
     * @param action - The action to execute.
     * @private
     */
    Endpoint.prototype._channelAction = function (channelName, event, action) {
        var channel = this._findChannel(channelName);
        if (!channel)
            throw new pondbase_1.PondError("Channel not found", 404, { channelName: channelName, event: event });
        return action(channel);
    };
    return Endpoint;
}(pondbase_1.BaseClass));
exports.Endpoint = Endpoint;
