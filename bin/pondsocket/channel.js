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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
var pondbase_1 = require("../pondbase");
var enums_1 = require("./enums");
var Channel = /** @class */ (function (_super) {
    __extends(Channel, _super);
    function Channel(name, removeChannel) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this._channelPresence = new pondbase_1.PondBase();
        _this._channelAssigns = {};
        _this._channelData = {};
        _this._broadcast = new pondbase_1.Broadcast();
        _this.removeChannel = removeChannel;
        _this._messages = new pondbase_1.Broadcast();
        return _this;
    }
    Object.defineProperty(Channel.prototype, "info", {
        /**
         * @desc Returns the channel info
         */
        get: function () {
            var data = {
                name: this.name, channelData: this.data, presence: this.presence, assigns: this.assigns
            };
            return Object.freeze(data);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "data", {
        /**
         * @desc Gets the channel's data
         */
        get: function () {
            var result = __assign({}, this._channelData);
            return Object.freeze(result);
        },
        /**
         * @desc Sets the channel's data
         * @param data
         */
        set: function (data) {
            this._channelData = __assign(__assign({}, this._channelData), data);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "presence", {
        /**
         * @desc Gets the channel's presence
         */
        get: function () {
            return this._channelPresence.toArray()
                .map(function (presence) { return presence.doc; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "assigns", {
        /**
         * @desc Gets the channel's assigns
         */
        get: function () {
            var _this = this;
            var assigns = {};
            Object.keys(this._channelAssigns).forEach(function (clientId) {
                var _a = _this._channelAssigns[clientId], presenceId = _a.presenceId, rest = __rest(_a, ["presenceId"]);
                assigns[clientId] = rest;
            });
            return assigns;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Checks if a user exists in the channel
     * @param clientId - The clientId of the user
     */
    Channel.prototype.hasUser = function (clientId) {
        return !!this._channelAssigns[clientId];
    };
    /**
     * @desc Adds a new user to the channel
     * @param user - The user to add to the channel
     */
    Channel.prototype.addUser = function (user) {
        var clientId = user.client.clientId;
        if (this.hasUser(clientId)) {
            throw new pondbase_1.PondError('User already exists in channel', 5001, clientId);
        }
        var doc = this._channelPresence.set(__assign(__assign({}, user.presence), { id: clientId }));
        this._channelAssigns[clientId] = __assign(__assign({}, user.assigns), { presenceId: doc.id });
        this._channelData = __assign(__assign({}, this._channelData), user.channelData);
        this._broadcast.publish({
            event: 'JOIN_CHANNEL',
            channelName: this.name,
            action: enums_1.ServerActions.PRESENCE,
            payload: {
                presence: this.presence, change: __assign(__assign({}, user.presence), { id: clientId })
            },
            channel: this, clientId: enums_1.PondSenders.POND_CHANNEL,
            clientAssigns: user.assigns, clientPresence: __assign(__assign({}, user.presence), { id: clientId })
        });
    };
    /**
     * @desc Gets a user's information
     * @param clientId - The clientId of the user
     */
    Channel.prototype.getUserInfo = function (clientId) {
        var client = this._retrieveUser(clientId);
        if (!client)
            return null;
        return {
            presence: client.presence.doc, assigns: client.assigns
        };
    };
    /**
     * @desc Removes a user or group of users from the channel
     * @param clientIds - The clientIds of the users to remove
     */
    Channel.prototype.removeUser = function (clientIds) {
        var _this = this;
        var clients = Array.isArray(clientIds) ? clientIds : [clientIds];
        clients.forEach(function (clientId) {
            var client = _this._retrieveUser(clientId);
            if (client) {
                client.presence.removeDoc();
                delete _this._channelAssigns[clientId];
                _this._broadcast.publish({
                    event: 'LEAVE_CHANNEL',
                    channelName: _this.name,
                    action: enums_1.ServerActions.PRESENCE,
                    payload: {
                        presence: _this.presence, change: null,
                    },
                    channel: _this, clientId: enums_1.PondSenders.POND_CHANNEL,
                    clientAssigns: client.assigns, clientPresence: client.presence.doc
                });
            }
        });
        if (this._channelPresence.size === 0) {
            this._broadcast.publish({
                event: 'REMOVE_CHANNEL',
                channelName: this.name,
                action: enums_1.ServerActions.CLOSE,
                payload: {}, channel: this,
                clientId: enums_1.PondSenders.POND_CHANNEL,
                clientAssigns: {}, clientPresence: {}
            });
            this.removeChannel();
        }
    };
    /**
     * @desc Broadcasts a message to all users in the channel
     * @param event - The event name
     * @param message - The message to send
     * @param sender - The sender of the message
     */
    Channel.prototype.broadcast = function (event, message, sender) {
        if (sender === void 0) { sender = enums_1.PondSenders.POND_CHANNEL; }
        var client = this._retrieveUser(sender);
        if (!client && !Object.values(enums_1.PondSenders).includes(sender))
            throw new pondbase_1.PondError('Client not found', 5002, sender);
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        var value = this._broadcast.publish(__assign(__assign({}, newMessage), { channel: this, clientId: sender, clientAssigns: client ? client.assigns : {}, clientPresence: client ? client.presence.doc : {} }));
        if (value instanceof pondbase_1.PondError)
            throw value;
        this._sendToClients(Object.keys(this._channelAssigns), newMessage);
    };
    /**
     * @desc Broadcasts a message to all users in the channel except the sender
     * @param event - The event name
     * @param message - The message to send
     * @param clientId - The client id of the sender
     */
    Channel.prototype.broadcastFrom = function (event, message, clientId) {
        var client = this._retrieveUser(clientId);
        if (!client)
            throw new pondbase_1.PondError('Client not found', 5002, clientId);
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        var value = this._broadcast.publish(__assign(__assign({}, newMessage), { channel: this, clientId: clientId, clientAssigns: client.assigns, clientPresence: client.presence.doc }));
        if (value instanceof pondbase_1.PondError)
            throw value;
        var clientIds = Object.keys(this._channelAssigns)
            .filter(function (id) { return id !== clientId; });
        this._sendToClients(clientIds, newMessage);
    };
    /**
     * @desc Sends a message to a specific user or group of users
     * @param event - The event name
     * @param clientId - The client id of the user to send the message to
     * @param message - The message to send
     * @param sender - The client id of the sender
     */
    Channel.prototype.sendTo = function (event, message, sender, clientId) {
        var _this = this;
        var client = this._retrieveUser(sender);
        if (!client && !Object.values(enums_1.PondSenders).includes(sender))
            throw new pondbase_1.PondError('Client not found', 5002, sender);
        var clientIds = Array.isArray(clientId) ? clientId : [clientId];
        var notFound = clientIds.filter(function (id) { return !_this._channelAssigns[id]; });
        if (notFound.length > 0)
            throw new pondbase_1.PondError('Recipient not found', 5002, notFound);
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        var value = this._broadcast.publish(__assign(__assign({}, newMessage), { channel: this, clientId: sender, clientAssigns: (client === null || client === void 0 ? void 0 : client.assigns) || {}, clientPresence: (client === null || client === void 0 ? void 0 : client.presence.doc) || {} }));
        if (value instanceof pondbase_1.PondError)
            throw value;
        this._sendToClients(clientIds, newMessage);
    };
    /**
     * @desc Subscribes to a channel event
     */
    Channel.prototype.subscribe = function (callback) {
        return this._broadcast.subscribe(callback);
    };
    /**
     * @desc Updates the state of a user in the channel
     * @param clientId - The clientId of the user to update
     * @param presence - The new presence of the user
     * @param assigns - The new assigns of the user
     */
    Channel.prototype.updateUser = function (clientId, presence, assigns) {
        var client = this._retrieveUser(clientId);
        if (client) {
            this._channelAssigns[clientId] = __assign(__assign(__assign({}, client.assigns), assigns), { presenceId: client.presence.id });
            var presenceDoc = __assign(__assign(__assign({}, client.presence.doc), presence), { id: clientId });
            if (!this.areEqual(presenceDoc, client.presence.doc)) {
                client.presence.updateDoc(presenceDoc);
                this._broadcast.publish({
                    event: 'UPDATE_CHANNEL',
                    channelName: this.name,
                    action: enums_1.ServerActions.PRESENCE,
                    payload: {
                        presence: this.presence, change: { clientId: clientId, presence: presence, assigns: assigns },
                    },
                    channel: this,
                    clientId: enums_1.PondSenders.POND_CHANNEL,
                    clientAssigns: __assign(__assign({}, client.assigns), assigns),
                    clientPresence: __assign({}, presenceDoc)
                });
            }
        }
    };
    /**
     * @desc Subscribes to a channel event
     * @param clientId - The client id of the user to send the message to
     * @param callback - The callback to call when a message is received
     */
    Channel.prototype.subscribeToMessages = function (clientId, callback) {
        var _this = this;
        var sub1 = this._messages.subscribe(function (_a) {
            var clients = _a.clients, message = _a.message;
            if (clients.includes(clientId))
                callback(message);
        });
        var sub2 = this._channelPresence.subscribe(function (docs, change, action) {
            var message = {
                action: enums_1.ServerActions.PRESENCE,
                payload: { presence: docs, change: change },
                event: action,
                channelName: _this.name,
            };
            callback(message);
        });
        return {
            unsubscribe: function () {
                sub1.unsubscribe();
                sub2.unsubscribe();
            }
        };
    };
    /**
     * @desc Sends a message to a specific user or group of users except the sender
     * @param clients - The client id of the user to send the message to
     * @param message - The message to send
     * @private
     */
    Channel.prototype._sendToClients = function (clients, message) {
        this._messages.publish({ clients: clients, message: message });
    };
    /**
     * @desc Retrieves a user from the channel
     * @param clientId - The client id of the user to retrieve
     * @private
     */
    Channel.prototype._retrieveUser = function (clientId) {
        var user = this._channelAssigns[clientId];
        var presence = this._channelPresence.get((user === null || user === void 0 ? void 0 : user.presenceId) || '');
        if (user && presence !== null) {
            var presenceId = user.presenceId, assigns = __rest(user, ["presenceId"]);
            return {
                assigns: assigns, presence: presence,
            };
        }
        return null;
    };
    return Channel;
}(pondbase_1.BaseClass));
exports.Channel = Channel;
