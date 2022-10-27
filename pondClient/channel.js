"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var pondSocket_1 = require("../pondSocket");
var pondBase_1 = require("../pondBase");
var Channel = /** @class */ (function () {
    function Channel(channel, params, socket) {
        this._subscriptions = [];
        this._presenceSubject = new rxjs_1.Subject();
        this.channel = channel;
        this._params = params;
        this._socket = socket;
        this._subject = new rxjs_1.Subject();
        this._connectedSubject = new pondBase_1.Subject(false);
    }
    Object.defineProperty(Channel.prototype, "isActive", {
        get: function () {
            return this._connectedSubject.value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Connects to the channel.
     */
    Channel.prototype.join = function () {
        var _this = this;
        if (this._connectedSubject.value)
            return this;
        var observable = this._init();
        var subscription = observable
            .subscribe(function (message) {
            _this._connectedSubject.publish(true);
            if (message.action === "PRESENCE")
                _this._presenceSubject.next(message.payload.presence);
            else if (message.action === "MESSAGE")
                _this._subject.next(message);
            else if (message.event === "KICKED_FROM_CHANNEL")
                _this.leave();
        });
        this._subscriptions.push(subscription);
        return this;
    };
    /**
     * @desc Disconnects from the channel.
     */
    Channel.prototype.leave = function () {
        void this._connectedSubject.publish(false);
        this._presenceSubject.complete();
        this._subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); });
        this._subscriptions = [];
        this._subject.complete();
    };
    /**
     * @desc Monitors the presence state of the channel.
     * @param callback - The callback to call when the presence state changes.
     */
    Channel.prototype.onPresenceUpdate = function (callback) {
        var sub = this._presenceSubject.subscribe(callback);
        this._subscriptions.push(sub);
        return sub;
    };
    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    Channel.prototype.onMessage = function (callback) {
        var sub = this._subject
            .pipe((0, operators_1.filter)(function (message) { return message.action === "MESSAGE"; }))
            .subscribe(function (message) { return callback(message.event, message.payload); });
        this._subscriptions.push(sub);
        return sub;
    };
    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    Channel.prototype.broadcast = function (event, payload) {
        var message = {
            channelName: this.channel,
            payload: payload,
            event: event,
            action: pondSocket_1.ClientActions.BROADCAST
        };
        this._socket.next(message);
    };
    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    Channel.prototype.broadcastFrom = function (event, payload) {
        var message = {
            channelName: this.channel,
            payload: payload,
            event: event,
            action: pondSocket_1.ClientActions.BROADCAST_FROM
        };
        this._socket.next(message);
    };
    /**
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    Channel.prototype.updatePresence = function (presence) {
        this._socket.next({
            action: pondSocket_1.ClientActions.UPDATE_PRESENCE,
            channelName: this.channel,
            event: "PRESENCE",
            payload: presence
        });
    };
    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    Channel.prototype.sendMessage = function (event, payload, recipient) {
        var addresses = Array.isArray(recipient) ? recipient : [recipient];
        var message = {
            channelName: this.channel,
            payload: payload,
            event: event,
            addresses: addresses,
            action: pondSocket_1.ClientActions.SEND_MESSAGE_TO_USER
        };
        this._socket.next(message);
    };
    /**
     * @desc Listens for the connections state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    Channel.prototype.onConnectionChange = function (callback) {
        var sub = this._connectedSubject.subscribe(callback);
        this._subscriptions.push(sub);
        return sub;
    };
    /**
     * @desc Initializes the channel.
     * @private
     */
    Channel.prototype._init = function () {
        var _this = this;
        var observable = this._socket.multiplex(function () { return ({
            action: "JOIN_CHANNEL",
            channelName: _this.channel,
            event: "JOIN_CHANNEL",
            payload: _this._params
        }); }, function () { return ({
            action: "LEAVE_CHANNEL",
            channelName: _this.channel,
            event: "LEAVE_CHANNEL",
            payload: _this._params
        }); }, function (message) { return message.channelName === _this.channel; });
        return observable;
    };
    return Channel;
}());
exports.Channel = Channel;
