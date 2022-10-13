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
exports.PondChannel = void 0;
var pondbase_1 = require("../pondbase");
var channel_1 = require("./channel");
var enums_1 = require("./enums");
var pondResponse_1 = require("./pondResponse");
var PondChannel = /** @class */ (function (_super) {
    __extends(PondChannel, _super);
    function PondChannel(path, handler) {
        var _this = _super.call(this) || this;
        _this._channels = new pondbase_1.PondBase();
        _this._handler = handler;
        _this.path = path;
        _this._subscribers = new Set();
        _this._subscriptions = {};
        return _this;
    }
    Object.defineProperty(PondChannel.prototype, "info", {
        /**
         * @desc Gets a list of all the channels in the endpoint.
         */
        get: function () {
            return this._channels.map(function (channel) { return channel.info; });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Sends a message to a client
     * @param socket - The socket to send the message to
     * @param message - The message to send
     */
    PondChannel._sendMessage = function (socket, message) {
        socket.send(JSON.stringify(message));
    };
    /**
     * @desc A listener for a channel event
     * @param event - The event to listen for, can be a regex
     * @param callback - The callback to call when the event is received
     */
    PondChannel.prototype.on = function (event, callback) {
        var resolver = this._buildHandler(event, callback);
        this._subscribers.add(resolver);
    };
    /**
     * @desc Add new user to channel
     * @param user - The user to add to the channel
     * @param channelName - The name of the channel
     * @param joinParams - The params to join the channel with
     */
    PondChannel.prototype.addUser = function (user, channelName, joinParams) {
        var _this = this;
        return (0, pondbase_1.BasePromise)({ channelName: channelName }, function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var channel, resolved, assigns, request, resolver, response;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        channel = (_a = this._channels.query(function (c) { return c.name === channelName; })[0]) === null || _a === void 0 ? void 0 : _a.doc;
                        resolved = this.generateEventRequest(this.path, channelName);
                        if (!resolved)
                            return [2 /*return*/, reject("Invalid channel name", 400)];
                        if (!!channel) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._createChannel(channelName)];
                    case 1:
                        channel = _b.sent();
                        _b.label = 2;
                    case 2:
                        assigns = {
                            assigns: user.assigns,
                            presence: {},
                            channelData: channel.data
                        };
                        request = __assign(__assign({ joinParams: joinParams }, resolved), { clientId: user.clientId, channelName: channelName, clientAssigns: user.assigns });
                        resolver = function (data) {
                            if (data.error)
                                return reject(data.error.errorMessage, data.error.errorCode);
                            var _a = data.assigns, assigns = _a.assigns, presence = _a.presence, channelData = _a.channelData;
                            _this._subscriptions[user.clientId] = _this._subscriptions[user.clientId] || [];
                            var sub = channel.subscribeToMessages(user.clientId, function (event) {
                                PondChannel._sendMessage(user.socket, event);
                            });
                            channel.addUser({
                                presence: presence,
                                assigns: assigns,
                                channelData: channelData,
                                client: user
                            });
                            _this._subscriptions[user.clientId].push({ name: channelName, sub: sub });
                            if (data.message)
                                channel.sendTo(data.message.event, data.message.payload, enums_1.PondSenders.POND_CHANNEL, [user.clientId]);
                            resolve();
                        };
                        response = new pondResponse_1.PondResponse({ channelName: channelName }, assigns, resolver);
                        return [4 /*yield*/, this._handler(request, response, channel)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * @desc Sends a message to a channel in the endpoint.
     * @param channelName - The name of the channel to send the message to.
     * @param event - The event to send the message with.
     * @param message - The message to send.
     */
    PondChannel.prototype.broadcastToChannel = function (channelName, event, message) {
        this._execute(channelName, function (channel) {
            channel.broadcast(event, message, enums_1.PondSenders.POND_CHANNEL);
        });
    };
    /**
     * @desc Closes a client connection to a channel in the endpoint.
     * @param channelName - The name of the channel to close the connection to.
     * @param clientId - The id of the client to close the connection to.
     */
    PondChannel.prototype.closeFromChannel = function (channelName, clientId) {
        var _this = this;
        this._execute(channelName, function (channel) {
            _this._removeSubscriptions(clientId, channelName);
            channel.removeUser(clientId);
        });
    };
    /**
     * @desc Modify the presence of a client in a channel on the endpoint.
     * @param channelName - The name of the channel to modify the presence of.
     * @param clientId - The id of the client to modify the presence of.
     * @param assigns - The assigns to modify the presence with.
     */
    PondChannel.prototype.modifyPresence = function (channelName, clientId, assigns) {
        this._execute(channelName, function (channel) {
            channel.updateUser(clientId, assigns.presence || {}, assigns.assigns || {});
        });
    };
    /**
     * @desc Gets the information of the channel
     * @param channelName - The name of the channel to get the information of.
     */
    PondChannel.prototype.getChannelInfo = function (channelName) {
        return this._execute(channelName, function (channel) {
            return channel.info;
        });
    };
    /**
     * @desc Sends a message to the channel
     * @param channelName - The name of the channel to send the message to.
     * @param clientId - The clientId to send the message to, can be an array of clientIds
     * @param event - The event to send the message to
     * @param message - The message to send
     */
    PondChannel.prototype.send = function (channelName, clientId, event, message) {
        var clients = Array.isArray(clientId) ? clientId : [clientId];
        this._execute(channelName, function (channel) {
            channel.sendTo(event, message, enums_1.PondSenders.POND_CHANNEL, clients);
        });
    };
    /**
     * @desc Searches for a channel in the endpoint.
     * @param query - The query to search for.
     */
    PondChannel.prototype.findChannel = function (query) {
        var _a;
        return ((_a = this._channels.find(query)) === null || _a === void 0 ? void 0 : _a.doc) || null;
    };
    /**
     * @desc Subscribes a function to a channel in the endpoint.
     * @param channelName - The name of the channel to subscribe to.
     * @param callback - The function to subscribe to the channel.
     */
    PondChannel.prototype.subscribe = function (channelName, callback) {
        var channel = this._channels.query(function (c) { return c.name === channelName; })[0];
        if (channel)
            return channel.doc.subscribe(callback);
        var newChannel = this._createChannel(channelName);
        return newChannel.subscribe(callback);
    };
    /**
     * @desc removes a user from all channels
     * @param clientId - The id of the client to remove
     */
    PondChannel.prototype.removeUser = function (clientId) {
        var e_1, _a;
        if (this._subscriptions[clientId]) {
            this._subscriptions[clientId].forEach(function (doc) { return doc.sub.unsubscribe(); });
            delete this._subscriptions[clientId];
            try {
                for (var _b = __values(this._channels.generate()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var channel = _c.value;
                    if (channel.hasUser(clientId))
                        channel.removeUser(clientId);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    /**
     * @desc Executes a function on a channel in the endpoint.
     * @param channelName - The name of the channel to execute the function on.
     * @param handler - The function to execute on the channel.
     * @private
     */
    PondChannel.prototype._execute = function (channelName, handler) {
        var newChannel = this.findChannel(function (c) { return c.name === channelName; }) || null;
        if (newChannel)
            return handler(newChannel);
        throw new pondbase_1.PondError("Channel does not exist", 404, channelName);
    };
    /**
     * @desc Creates a new channel in the endpoint.
     * @param channelName - The name of the channel to create.
     * @private
     */
    PondChannel.prototype._createChannel = function (channelName) {
        var newChannel = this._channels.createDocument(function (doc) {
            return new channel_1.Channel(channelName, doc.removeDoc.bind(doc));
        });
        this._subscribers.forEach(function (subscriber) {
            newChannel.doc.subscribe(subscriber);
        });
        return newChannel.doc;
    };
    /**
     * @desc Removes a subscription from a user
     * @param clientId - The id of the client to remove the subscription from
     * @param channelName - The name of the channel to remove the subscription from
     * @private
     */
    PondChannel.prototype._removeSubscriptions = function (clientId, channelName) {
        var _this = this;
        var clients = Array.isArray(clientId) ? clientId : [clientId];
        clients.forEach(function (client) {
            var subs = _this._subscriptions[client];
            if (subs) {
                var sub = subs.find(function (s) { return s.name === channelName; });
                if (sub) {
                    sub.sub.unsubscribe();
                    subs.splice(subs.indexOf(sub), 1);
                }
            }
        });
    };
    /**
     * @desc Builds an event handler for a channel
     * @param event - The event to build the handler for
     * @param callback - The callback to build the handler for
     * @private
     */
    PondChannel.prototype._buildHandler = function (event, callback) {
        var _this = this;
        return function (data) {
            var returnVal = undefined;
            var info = _this.generateEventRequest(event, data.event);
            if (info) {
                var assigns = {
                    assigns: data.clientAssigns,
                    presence: data.clientPresence,
                    channelData: data.channel.data
                };
                var request = {
                    channelName: data.channelName,
                    message: data.payload,
                    params: info.params,
                    query: info.query,
                    event: data.event,
                    client: {
                        clientId: data.clientId,
                        clientAssigns: data.clientAssigns,
                        clientPresence: data.clientPresence
                    }
                };
                var resolver = function (innerData) {
                    var _a = innerData.assigns, presence = _a.presence, assigns = _a.assigns, channelData = _a.channelData;
                    if (innerData.error)
                        returnVal = new pondbase_1.PondError(innerData.error.errorMessage, innerData.error.errorCode, {
                            event: data.event,
                            channelName: data.channelName
                        });
                    else {
                        if (!_this.isObjectEmpty(channelData))
                            data.channel.data = channelData;
                        if (!Object.values(enums_1.PondSenders).includes(data.clientId)) {
                            data.channel.updateUser(data.clientId, presence, assigns);
                            if (innerData.message)
                                data.channel.sendTo(innerData.message.event, innerData.message.payload, enums_1.PondSenders.POND_CHANNEL, [data.clientId]);
                        }
                    }
                };
                var response = new pondResponse_1.PondResponse(data.clientId, assigns, resolver);
                callback(request, response, data.channel);
            }
            return returnVal || !!info;
        };
    };
    return PondChannel;
}(pondbase_1.BaseClass));
exports.PondChannel = PondChannel;
