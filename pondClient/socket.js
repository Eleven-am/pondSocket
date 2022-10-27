"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondClient = void 0;
var webSocket_1 = require("rxjs/webSocket");
var rxjs_1 = require("rxjs");
var channel_1 = require("./channel");
var operators_1 = require("rxjs/operators");
var pondBase_1 = require("../pondBase");
var PondClient = /** @class */ (function () {
    function PondClient(endpoint, params) {
        this.socketState = "CLOSED";
        /**
         * @desc A retry strategy for the socket.
         * @param maxTries - The maximum number of retries.
         * @param ms - The number of milliseconds to wait before retrying.
         */
        this._retryStrategy = function (maxTries, ms) {
            return (0, rxjs_1.pipe)((0, operators_1.retryWhen)(function (attempts) {
                var observableForRetries = (0, rxjs_1.zip)((0, rxjs_1.range)(1, maxTries), attempts)
                    .pipe((0, operators_1.map)(function (_a) {
                    var _b = __read(_a, 1), elemFromRange = _b[0];
                    return elemFromRange;
                }), (0, operators_1.map)(function (i) { return i * i; }), (0, rxjs_1.switchMap)(function (i) { return (0, rxjs_1.timer)(i * ms); }));
                var observableForFailure = (0, rxjs_1.throwError)(new Error("Could not connect to server"))
                    .pipe((0, rxjs_1.materialize)(), (0, rxjs_1.delay)(1000), (0, rxjs_1.dematerialize)());
                return (0, rxjs_1.concat)(observableForRetries, observableForFailure);
            }));
        };
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
        this.channels = new pondBase_1.PondBase();
    }
    /**
     * @desc Connects to the server and returns the socket.
     */
    PondClient.prototype.connect = function () {
        var _this = this;
        if (this.socketState !== "CLOSED")
            return;
        this.socketState = "CONNECTING";
        var socket = (0, webSocket_1.webSocket)({
            url: this.address.toString(),
            openObserver: {
                next: function () {
                    _this.socketState = "OPEN";
                }
            },
            closeObserver: {
                next: function () {
                    _this.socketState = "CLOSED";
                }
            },
            closingObserver: {
                next: function () {
                    _this.socketState = "CLOSING";
                }
            }
        });
        this.socket = socket;
        this.subscription = socket.pipe(this._retryStrategy(100, 1000)).subscribe();
        return this;
    };
    /**
     * @desc Returns the current state of the socket.
     */
    PondClient.prototype.getState = function () {
        return this.socketState;
    };
    /**
     * @desc Creates a channel with the given name and params.
     * @param channel - The name of the channel.
     * @param params - The params to send to the server.
     */
    PondClient.prototype.createChannel = function (channel, params) {
        var _this = this;
        return this.channels.getOrCreate(channel, function () {
            return new channel_1.Channel(channel, params || {}, _this.socket);
        }).doc;
    };
    /**
     * @desc An event that is triggered when the socket receives a message.
     * @param callback - The callback to be called when the event is triggered.
     */
    PondClient.prototype.onMessage = function (callback) {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.subscribe(function (data) {
            if (data.event)
                callback(data.event, data.payload);
        });
    };
    /**
     * @desc Disconnects the socket from the server.
     */
    PondClient.prototype.disconnect = function () {
        var _a, _b, _c;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.complete();
        (_b = this.socket) === null || _b === void 0 ? void 0 : _b.unsubscribe();
        (_c = this.subscription) === null || _c === void 0 ? void 0 : _c.unsubscribe();
        this.socket = undefined;
        this.channels = new pondBase_1.PondBase();
    };
    return PondClient;
}());
exports.PondClient = PondClient;
