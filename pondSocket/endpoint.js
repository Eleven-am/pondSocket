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
var pondBase_1 = require("../pondBase");
var pondChannel_1 = require("./pondChannel");
var pondResponse_1 = require("./pondResponse");
var Endpoint = /** @class */ (function (_super) {
    __extends(Endpoint, _super);
    function Endpoint(server, handler) {
        var _this = _super.call(this) || this;
        _this._channels = new pondBase_1.SimpleBase();
        _this._sockets = new pondBase_1.SimpleBase();
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
        this._channels.set(path.toString(), pondChannel);
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
        var doc = this._sockets.createGenericDocument();
        var req = __assign(__assign({ headers: request.headers }, data), { clientId: doc.id });
        var resolver = function (assigns, data) {
            if (data.error) {
                socket.write("HTTP/1.1 ".concat(data.error.code, " ").concat(data.error.message, "\r\n\r\n"));
                return socket.destroy();
            }
            _this._server.handleUpgrade(request, socket, head, function (ws) {
                _this._server.emit("connection", ws);
                var socketCache = {
                    socket: ws,
                    assigns: assigns
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
            });
        };
        var res = new pondResponse_1.EndpointResponse(resolver);
        this._handler(req, res, this);
    };
    /**
     * @desc Closes a client connection to the endpoint.
     * @param clientId - The id of the client to close the connection to.
     */
    Endpoint.prototype.closeConnection = function (clientId) {
        var message = {
            action: enums_1.ServerActions.CLOSE,
            channelName: "SERVER",
            event: "CLOSED_FROM_SERVER", payload: {}
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
        var _this = this;
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE,
            channelName: enums_1.PondSenders.ENDPOINT,
            event: event,
            payload: message
        };
        var stringifiedMessage = JSON.stringify(newMessage);
        var addresses = Array.isArray(clientId) ? clientId : [clientId];
        addresses.forEach(function (address) {
            var socketDoc = _this._sockets.get(address);
            if (socketDoc)
                socketDoc.doc.socket.send(stringifiedMessage);
        });
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
        var sockets = __spreadArray([], __read(this._sockets.generator()), false);
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE,
            channelName: enums_1.PondSenders.ENDPOINT,
            event: event,
            payload: message
        };
        var stringifiedMessage = JSON.stringify(newMessage);
        sockets.forEach(function (doc) { return doc.doc.socket.send(stringifiedMessage); });
    };
    /**
     * @desc Searches for a channel in the endpoint.
     * @param name - The name of the channel to search for.
     */
    Endpoint.prototype._findChannel = function (name) {
        var pond = this._findPondChannel(name);
        if (pond) {
            var channel = pond.doc.getChannel(name);
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
        socket.addEventListener("message", function (message) {
            _this._readMessage(cache, message.data);
        });
        socket.addEventListener("close", function () {
            var e_1, _a;
            try {
                for (var _b = __values(_this._channels.generator()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var channel = _c.value;
                    channel.doc.removeUser(cache.id);
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
                for (var _b = __values(_this._channels.generator()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var channel = _c.value;
                    channel.doc.removeUser(cache.id);
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
        var errorMessage = {
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {}
        };
        try {
            var data = JSON.parse(message);
            if (!data.action)
                errorMessage.payload = {
                    message: "No action provided"
                };
            else if (!data.channelName)
                errorMessage.payload = {
                    message: "No channel name provided"
                };
            else if (!data.payload)
                errorMessage.payload = {
                    message: "No payload provided"
                };
            else
                this._handleMessage(cache, data);
            if (!this.isObjectEmpty(errorMessage.payload))
                Endpoint._sendMessage(cache.doc.socket, errorMessage);
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                errorMessage.payload = {
                    message: "Invalid JSON"
                };
                Endpoint._sendMessage(cache.doc.socket, errorMessage);
            }
            else if (e instanceof Error) {
                errorMessage.payload = {
                    message: e.message,
                };
                Endpoint._sendMessage(cache.doc.socket, errorMessage);
            }
        }
    };
    /**
     * @desc Deals with a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     */
    Endpoint.prototype._handleMessage = function (cache, message) {
        switch (message.action) {
            case "JOIN_CHANNEL":
                var pond = this._findPondChannel(message.channelName);
                if (pond) {
                    var user = {
                        clientId: cache.id,
                        socket: cache.doc.socket,
                        assigns: cache.doc.assigns
                    };
                    pond.doc.addUser(user, message.channelName, message.payload);
                }
                else
                    throw new Error("Channel ".concat(message.channelName, " does not exist"));
                break;
            case "LEAVE_CHANNEL":
                this._channelAction(message.channelName, "LEAVE_CHANNEL", function (channel) {
                    channel.removeUser(cache.id);
                });
                break;
            case "BROADCAST_FROM":
                this._channelAction(message.channelName, message.event, function (channel) {
                    channel.broadcastFrom(message.event, message.payload, cache.id);
                });
                break;
            case "BROADCAST":
                this._channelAction(message.channelName, message.event, function (channel) {
                    channel.broadcast(message.event, message.payload, cache.id);
                });
                break;
            case "SEND_MESSAGE_TO_USER":
                this._channelAction(message.channelName, message.event, function (channel) {
                    if (!message.addresses || message.addresses.length === 0)
                        throw new Error("No addresses provided");
                    channel.sendTo(message.event, message.payload, cache.id, message.addresses);
                });
                break;
            case "UPDATE_PRESENCE":
                this._channelAction(message.channelName, "UPDATE_PRESENCE", function (channel) {
                    var _a, _b;
                    channel.updateUser(cache.id, ((_a = message.payload) === null || _a === void 0 ? void 0 : _a.presence) || {}, ((_b = message.payload) === null || _b === void 0 ? void 0 : _b.assigns) || {});
                });
                break;
        }
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
            throw new Error("Channel ".concat(channelName, " does not exist"));
        try {
            return action(channel);
        }
        catch (e) {
            throw new Error("Error while executing event '".concat(event, "' on channel '").concat(channelName, "': ").concat(e.message));
        }
    };
    return Endpoint;
}(pondBase_1.BaseClass));
exports.Endpoint = Endpoint;
