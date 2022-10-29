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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
var pondBase_1 = require("../pondBase");
var enums_1 = require("./enums");
var channelMiddleWare_1 = require("./channelMiddleWare");
var Channel = /** @class */ (function (_super) {
    __extends(Channel, _super);
    function Channel(name, middleWare, removeChannel) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this._channelPresence = new pondBase_1.PondBase();
        _this._channelAssigns = new pondBase_1.SimpleBase();
        _this._channelData = {};
        _this._middleWare = new channelMiddleWare_1.ChannelMiddleware();
        _this.removeChannel = removeChannel;
        _this._messages = new pondBase_1.Broadcast();
        _this._middleWare.merge(middleWare);
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
            return this._channelPresence.map(function (presence) { return presence; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "assigns", {
        /**
         * @desc Gets the channel's assigns
         */
        get: function () {
            return this._channelAssigns.map(function (assigns) { return assigns; });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Gets a user's information
     * @param clientId - The clientId of the user
     */
    Channel.prototype.getUserInfo = function (clientId) {
        var client = this._retrieveUser(clientId);
        if (!client)
            return null;
        return {
            presence: client.presence.doc, assigns: client.assigns.doc
        };
    };
    /**
     * @desc Checks if a user exists in the channel
     * @param clientId - The clientId of the user
     */
    Channel.prototype.hasUser = function (clientId) {
        return this._channelPresence.has(clientId);
    };
    /**
     * @desc Adds a new user to the channel
     * @param user - The user to add to the channel
     */
    Channel.prototype.addUser = function (user) {
        var clientId = user.client.clientId;
        if (this.hasUser(clientId))
            throw new Error("User with clientId ".concat(clientId, " already exists in channel ").concat(this.name));
        this._channelPresence.set(clientId, __assign(__assign({}, user.presence), { id: clientId }));
        this._channelAssigns.set(clientId, user.assigns);
        this._channelData = Object.assign(__assign(__assign({}, this._channelData), user.channelData));
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
                client.assigns.removeDoc();
            }
        });
        if (this._channelPresence.size === 0)
            this.removeChannel();
    };
    /**
     * @desc Subscribes to the presence changes occuring in the channel
     * @param callback - The callback to call when a presence change occurs
     */
    Channel.prototype.onPresenceChange = function (callback) {
        var _this = this;
        return this._channelPresence.subscribe(function (docs, change, action) {
            var message = {
                action: enums_1.ServerActions.PRESENCE,
                payload: { presence: docs, change: change },
                event: action,
                channelName: _this.name,
            };
            callback(message);
        });
    };
    /**
     * @desc Subscribes to the message events occuring in the channel
     * @param callback - The callback to call when a message event occurs
     */
    Channel.prototype.onMessage = function (callback) {
        this._middleWare.use(callback);
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
            client.assigns.updateDoc(Object.assign(__assign({}, client.assigns.doc), assigns));
            var presenceDoc = Object.assign(__assign({}, client.presence.doc), presence);
            if (!this.areEqual(presenceDoc, client.presence.doc))
                client.presence.updateDoc(presenceDoc);
        }
    };
    /**
     * @desc Broadcasts a message to all users in the channel
     * @param event - The event name
     * @param message - The message to send
     * @param sender - The sender of the message
     */
    Channel.prototype.broadcast = function (event, message, sender) {
        var _this = this;
        if (sender === void 0) { sender = enums_1.PondSenders.POND_CHANNEL; }
        var client = this._retrieveUser(sender);
        if (!client && !Object.values(enums_1.PondSenders).includes(sender))
            throw new Error("Client with clientId ".concat(sender, " does not exist in channel ").concat(this.name));
        var channelEvent = {
            client: {
                clientId: sender,
                clientAssigns: client ? client.assigns.doc : {},
                clientPresence: client ? client.presence.doc : {}
            },
            event: event,
            payload: message,
            channel: this,
        };
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        void this._middleWare.run(channelEvent, function (hasErrored) {
            if (!hasErrored)
                _this._sendToClients(_this._channelAssigns.keys, newMessage);
        });
    };
    /**
     * @desc Broadcasts a message to all users in the channel except the sender
     * @param event - The event name
     * @param message - The message to send
     * @param clientId - The client id of the sender
     */
    Channel.prototype.broadcastFrom = function (event, message, clientId) {
        var _this = this;
        var client = this._retrieveUser(clientId);
        if (!client)
            throw new Error("Client with clientId ".concat(clientId, " does not exist in channel ").concat(this.name));
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        var channelEvent = {
            client: {
                clientId: clientId,
                clientAssigns: client.assigns.doc,
                clientPresence: client.presence.doc
            },
            event: event,
            payload: message,
            channel: this,
        };
        void this._middleWare.run(channelEvent, function (hasErrored) {
            if (!hasErrored) {
                var clientIds = _this._channelAssigns.keys.filter(function (id) { return id !== clientId; });
                _this._sendToClients(clientIds, newMessage);
            }
        });
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
            throw new Error('Client not found');
        var clientIds = Array.isArray(clientId) ? clientId : [clientId];
        var notFound = clientIds.filter(function (id) { return !_this._channelAssigns.has(id); });
        if (notFound.length > 0)
            throw new Error("Client(s) with clientId(s) ".concat(notFound.join(', '), " were not found in channel ").concat(this.name));
        var newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        var channelEvent = {
            client: {
                clientId: sender,
                clientAssigns: client ? client.assigns.doc : {},
                clientPresence: client ? client.presence.doc : {}
            },
            channel: this,
            event: event,
            payload: message,
        };
        void this._middleWare.run(channelEvent, function (hasErrored) {
            if (!hasErrored)
                _this._sendToClients(clientIds, newMessage);
        });
    };
    /**
     * @desc Subscribes to a channel event, used only by the sockets to subscribe to all events
     * @param clientId - The client id of the user to send the message to
     * @param callback - The callback to call when a message is received
     */
    Channel.prototype.subscribeToMessages = function (clientId, callback) {
        var sub1 = this._messages.subscribe(function (_a) {
            var clients = _a.clients, message = _a.message;
            if (clients.includes(clientId))
                callback(message);
        });
        var sub2 = this.onPresenceChange(callback);
        return {
            unsubscribe: function () {
                sub1.unsubscribe();
                sub2.unsubscribe();
            }
        };
    };
    /**
     * @desc Sends a message to a specific user without running the middleware
     * @param event - The event name
     * @param message - The message to send
     * @param client - The client id of the user to send the message to
     * @param action - The action to send
     */
    Channel.prototype.respondToClient = function (event, message, client, action) {
        if (action === void 0) { action = enums_1.ServerActions.MESSAGE; }
        var newMessage = {
            action: action,
            payload: message, event: event,
            channelName: this.name,
        };
        this._sendToClients([client], newMessage);
    };
    /**
     * @desc Sends a message to a specific user or group of users except the sender
     * @param clients - The client id of the user to send the message to
     * @param message - The message to send
     * @private
     */
    Channel.prototype._sendToClients = function (clients, message) {
        void this._messages.publish({ clients: clients, message: message });
    };
    /**
     * @desc Retrieves a user from the channel
     * @param clientId - The client id of the user to retrieve
     * @private
     */
    Channel.prototype._retrieveUser = function (clientId) {
        var assigns = this._channelAssigns.get(clientId);
        var presence = this._channelPresence.get(clientId);
        if (assigns && presence !== null) {
            return {
                assigns: assigns, presence: presence,
            };
        }
        return null;
    };
    return Channel;
}(pondBase_1.BaseClass));
exports.Channel = Channel;
