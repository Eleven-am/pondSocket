"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondClient = void 0;
var channel_1 = require("./channel");
var pondBase_1 = require("../pondBase");
var pondSocket_1 = require("../pondSocket");
var PondClient = /** @class */ (function () {
    function PondClient(endpoint, params) {
        var address;
        try {
            address = new URL(endpoint);
        }
        catch (e) {
            address = new URL(window.location.toString());
            address.pathname = endpoint;
        }
        var query = new URLSearchParams(params);
        address.search = query.toString();
        var protocol = address.protocol === "https:" ? "wss:" : "ws:";
        if (address.protocol !== "wss:" && address.protocol !== "ws:")
            address.protocol = protocol;
        this.address = address;
        this._socketState = "CLOSED";
        this._channels = {};
        this._broadcaster = new pondBase_1.Broadcast();
        this._receiver = new pondBase_1.Broadcast();
    }
    /**
     * @desc Returns the current state of the socket.
     */
    PondClient.prototype.getState = function () {
        return this._socketState;
    };
    /**
     * @desc Connects to the server and returns the socket.
     */
    PondClient.prototype.connect = function (backoff) {
        var _this = this;
        if (backoff === void 0) { backoff = 1; }
        var socket = new WebSocket(this.address.toString());
        var sub = this._receiver.subscribe(function (message) {
            socket.send(JSON.stringify(message));
        });
        socket.onopen = function () {
            _this._socketState = "OPEN";
        };
        socket.onclose = function () {
            _this._socketState = "CLOSED";
            sub.unsubscribe();
        };
        socket.onmessage = function (message) {
            var data = JSON.parse(message.data);
            _this._broadcaster.publish(data);
        };
        socket.onerror = function () {
            _this._socketState = "CLOSED";
            sub.unsubscribe();
            setTimeout(function () {
                _this.connect(backoff * 2);
            }, backoff * 1000);
        };
        this._socket = socket;
    };
    /**
     * @desc Disconnects the socket from the server.
     */
    PondClient.prototype.disconnect = function () {
        var _a;
        Object.values(this._channels).forEach(function (channel) { return channel.leave(); });
        this._socketState = "CLOSED";
        this._broadcaster.clear();
        this._receiver.clear();
        (_a = this._socket) === null || _a === void 0 ? void 0 : _a.close();
        this._channels = {};
    };
    /**
     * @desc An event that is triggered when the socket receives a message.
     * @param event - The event to subscribe to.
     * @param callback - The callback to be called when the event is triggered.
     */
    PondClient.prototype.onMessage = function (event, callback) {
        return this._broadcaster.subscribe(function (data) {
            if (data.action === pondSocket_1.ServerActions.MESSAGE && data.event === event)
                callback(data.payload);
        });
    };
    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    PondClient.prototype.createChannel = function (name, params) {
        if (this._channels[name])
            return this._channels[name];
        var channel = new channel_1.Channel(name, this._broadcaster, this._receiver, params);
        this._channels[name] = channel;
        return channel;
    };
    return PondClient;
}());
exports.PondClient = PondClient;
