"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
var pondSocket_1 = require("../pondSocket");
var pondBase_1 = require("../pondBase");
var Channel = /** @class */ (function () {
    function Channel(name, receiver, broadcaster, params) {
        var _this = this;
        this._name = name;
        this._joinParams = params || {};
        this._broadcaster = broadcaster;
        this._connection = new pondBase_1.Subject(false);
        this._receiver = new pondBase_1.Broadcast();
        this._subscription = receiver.subscribe(function (data) {
            if (data.channelName === name) {
                _this._receiver.publish(data);
                _this._connection.publish(true);
            }
        });
        this._presence = new pondBase_1.Subject({
            change: null,
            presence: []
        });
    }
    /**
     * @desc Connects to the channel.
     */
    Channel.prototype.join = function () {
        var _this = this;
        var joinMessage = {
            action: pondSocket_1.ClientActions.JOIN_CHANNEL,
            channelName: this._name,
            event: pondSocket_1.ClientActions.JOIN_CHANNEL,
            payload: this._joinParams
        };
        this._receiver.subscribe(function (data) {
            if (data.action === pondSocket_1.ServerActions.PRESENCE) {
                _this._presence.publish(data.payload);
            }
        });
        this._broadcaster.publish(joinMessage);
    };
    /**
     * @desc Disconnects from the channel.
     */
    Channel.prototype.leave = function () {
        var leaveMessage = {
            action: pondSocket_1.ClientActions.LEAVE_CHANNEL,
            channelName: this._name,
            event: pondSocket_1.ClientActions.LEAVE_CHANNEL,
            payload: {}
        };
        this._broadcaster.publish(leaveMessage);
        this._connection.publish(false);
        this._subscription.unsubscribe();
        this._connection.clear();
        this._receiver.clear();
        this._presence.clear();
    };
    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    Channel.prototype.onMessage = function (event, callback) {
        return this._receiver.subscribe(function (data) {
            if (data.action === pondSocket_1.ServerActions.MESSAGE && data.event === event)
                callback(data.payload);
        });
    };
    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    Channel.prototype.broadcast = function (event, payload) {
        var message = {
            action: pondSocket_1.ClientActions.BROADCAST, channelName: this._name, payload: payload, event: event
        };
        this._broadcaster.publish(message);
    };
    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    Channel.prototype.broadcastFrom = function (event, payload) {
        var message = {
            action: pondSocket_1.ClientActions.BROADCAST_FROM, channelName: this._name, payload: payload, event: event
        };
        this._broadcaster.publish(message);
    };
    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    Channel.prototype.sendMessage = function (event, payload, recipient) {
        var message = {
            action: pondSocket_1.ClientActions.SEND_MESSAGE_TO_USER,
            channelName: this._name,
            payload: payload,
            event: event,
            addresses: recipient
        };
        this._broadcaster.publish(message);
    };
    /**
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    Channel.prototype.updatePresence = function (presence) {
        var message = {
            action: pondSocket_1.ClientActions.UPDATE_PRESENCE,
            channelName: this._name,
            payload: presence,
            event: pondSocket_1.ClientActions.UPDATE_PRESENCE
        };
        this._broadcaster.publish(message);
    };
    /**
     * @desc Monitors the presence state of the channel.
     * @param callback - The callback to call when the presence state changes.
     */
    Channel.prototype.onPresence = function (callback) {
        return this._presence.subscribe(function (data) {
            callback(data.change, data.presence);
        });
    };
    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    Channel.prototype.onConnectionChange = function (callback) {
        return this._connection.subscribe(function (data) {
            callback(data);
        });
    };
    return Channel;
}());
exports.Channel = Channel;
