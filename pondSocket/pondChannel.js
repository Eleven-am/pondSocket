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
var pondBase_1 = require("../pondBase");
var channel_1 = require("./channel");
var enums_1 = require("./enums");
var pondResponse_1 = require("./pondResponse");
var channelMiddleWare_1 = require("./channelMiddleWare");
var PondChannel = /** @class */ (function (_super) {
    __extends(PondChannel, _super);
    function PondChannel(path, handler) {
        var _this = _super.call(this) || this;
        _this._channels = new pondBase_1.PondBase();
        _this._handler = handler;
        _this.path = path;
        _this._subscriptions = {};
        _this._middleware = new channelMiddleWare_1.ChannelMiddleware();
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
        this._buildHandler(event, callback);
    };
    /**
     * @desc Add new user to channel
     * @param user - The user to add to the channel
     * @param channelName - The name of the channel
     * @param joinParams - The params to join the channel with
     */
    PondChannel.prototype.addUser = function (user, channelName, joinParams) {
        var _this = this;
        var document = this._getChannel(channelName);
        var channel = document.doc;
        var resolver = function (newAssigns, message) {
            var assigns = newAssigns.assigns, presence = newAssigns.presence, channelData = newAssigns.channelData;
            _this._subscriptions[user.clientId] = _this._subscriptions[user.clientId] || [];
            var sub = channel.subscribeToMessages(user.clientId, function (event) {
                PondChannel._sendMessage(user.socket, event);
            });
            _this._subscriptions[user.clientId].push({ name: channelName, sub: sub });
            channel.addUser({
                presence: presence,
                assigns: assigns,
                channelData: channelData,
                client: user
            });
            if (message)
                channel.sendTo(message.event, message.payload, enums_1.PondSenders.POND_CHANNEL, [user.clientId]);
        };
        var response = new pondResponse_1.PondChannelResponse(user, resolver);
        var resolved = this.generateEventRequest(this.path, channelName);
        if (resolved === null) {
            document.removeDoc();
            return response.reject("Invalid channel name: ".concat(channelName));
        }
        var request = __assign(__assign({ joinParams: joinParams }, resolved), { clientId: user.clientId, channelName: channelName, clientAssigns: user.assigns });
        this._handler(request, response, channel);
        if (channel.presence.length === 0)
            document.removeDoc();
        if (!response.isResolved)
            throw new Error("PondChannel: Response was not resolved");
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
     * @param channelName - The name of the channel to search for.
     */
    PondChannel.prototype.getChannel = function (channelName) {
        var _a;
        return ((_a = this._channels.get(channelName)) === null || _a === void 0 ? void 0 : _a.doc) || null;
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
                for (var _b = __values(this._channels), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var channel = _c.value;
                    if (channel.doc.hasUser(clientId))
                        channel.doc.removeUser(clientId);
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
        var newChannel = this.getChannel(channelName);
        if (newChannel)
            return handler(newChannel);
        throw new Error("Channel ".concat(channelName, " does not exist"));
    };
    /**
     * @desc Creates a new channel in the endpoint.
     * @param channelName - The name of the channel to create.
     * @private
     */
    PondChannel.prototype._getChannel = function (channelName) {
        var _this = this;
        return this._channels.getOrCreate(channelName, function (doc) {
            return new channel_1.Channel(channelName, _this._middleware, doc.removeDoc.bind(doc));
        });
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
        this._middleware.use(function (data, res, channel) {
            var info = _this.generateEventRequest(event, data.event);
            if (!info)
                return;
            var req = __assign(__assign({}, data), { params: info.params, query: info.query });
            callback(req, res, channel);
        });
    };
    return PondChannel;
}(pondBase_1.BaseClass));
exports.PondChannel = PondChannel;
