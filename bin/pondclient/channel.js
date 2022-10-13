"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var pondsocket_1 = require("../pondsocket");
var pondbase_1 = require("../pondbase");
var Channel = /** @class */ (function () {
    function Channel(channel, params, socket) {
        this.subscriptions = [];
        this.presenceSubject = new rxjs_1.Subject();
        this.channel = channel;
        this.params = params;
        this.socket = socket;
        this.subject = new rxjs_1.Subject();
        this.connectedSubject = new pondbase_1.Subject(false);
    }
    Object.defineProperty(Channel.prototype, "isActive", {
        get: function () {
            return this.connectedSubject.value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Connects to the channel.
     */
    Channel.prototype.join = function () {
        var _this = this;
        if (this.connectedSubject.value)
            return this;
        var observable = this.init();
        var subscription = observable
            .subscribe(function (message) {
            _this.connectedSubject.publish(true);
            if (message.action === "PRESENCE")
                _this.presenceSubject.next(message.payload.presence);
            else if (message.action === "MESSAGE")
                _this.subject.next(message);
            else if (message.event === "KICKED_FROM_CHANNEL")
                _this.leave();
        });
        this.subscriptions.push(subscription);
        return this;
    };
    /**
     * @desc Disconnects from the channel.
     */
    Channel.prototype.leave = function () {
        this.connectedSubject.publish(false);
        this.presenceSubject.complete();
        this.subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); });
        this.subscriptions = [];
        this.subject.complete();
    };
    /**
     * @desc Monitors the presence state of the channel.
     * @param callback - The callback to call when the presence state changes.
     */
    Channel.prototype.onPresenceUpdate = function (callback) {
        var sub = this.presenceSubject.subscribe(callback);
        this.subscriptions.push(sub);
        return sub;
    };
    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    Channel.prototype.onMessage = function (callback) {
        var sub = this.subject
            .pipe((0, operators_1.filter)(function (message) { return message.action === "MESSAGE"; }))
            .subscribe(function (message) { return callback(message.event, message.payload); });
        this.subscriptions.push(sub);
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
            action: pondsocket_1.ClientActions.BROADCAST
        };
        this.socket.next(message);
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
            action: pondsocket_1.ClientActions.BROADCAST_FROM
        };
        this.socket.next(message);
    };
    /**
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    Channel.prototype.updatePresence = function (presence) {
        this.socket.next({
            action: pondsocket_1.ClientActions.UPDATE_PRESENCE,
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
            action: pondsocket_1.ClientActions.SEND_MESSAGE_TO_USER
        };
        this.socket.next(message);
    };
    /**
     * @desc Listens for the connections state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    Channel.prototype.onConnectionChange = function (callback) {
        var sub = this.connectedSubject.subscribe(callback);
        this.subscriptions.push(sub);
        return sub;
    };
    /**
     * @desc Initializes the channel.
     * @private
     */
    Channel.prototype.init = function () {
        var _this = this;
        var observable = this.socket.multiplex(function () { return ({
            action: "JOIN_CHANNEL",
            channelName: _this.channel,
            event: "JOIN_CHANNEL",
            payload: _this.params
        }); }, function () { return ({
            action: "LEAVE_CHANNEL",
            channelName: _this.channel,
            event: "LEAVE_CHANNEL",
            payload: _this.params
        }); }, function (message) { return message.channelName === _this.channel; });
        return observable;
    };
    return Channel;
}());
exports.Channel = Channel;
