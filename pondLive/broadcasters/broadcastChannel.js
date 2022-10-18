"use strict";
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
exports.BroadcastChannel = void 0;
var pondBase_1 = require("../../pondBase");
var BroadcastChannel = /** @class */ (function () {
    function BroadcastChannel(initialData) {
        this._channelData = initialData;
        this._database = new pondBase_1.SimpleBase();
        this._name = Math.random().toString(36).substring(7);
    }
    Object.defineProperty(BroadcastChannel.prototype, "channelData", {
        get: function () {
            var temp = __assign({}, this._channelData);
            return Object.freeze(temp);
        },
        enumerable: false,
        configurable: true
    });
    BroadcastChannel.prototype.assign = function (assigns) {
        this._channelData = Object.assign(this._channelData, assigns);
    };
    BroadcastChannel.prototype.subscribe = function (socket) {
        var doc = this._database.set(socket.clientId, socket);
        var subscription = {
            unsubscribe: function () {
                doc.removeDoc();
            }
        };
        socket.addSubscription(subscription);
        return subscription;
    };
    BroadcastChannel.prototype.broadcast = function (payload) {
        var _this = this;
        this._database.toArray()
            .forEach(function (doc) { return doc.doc.onMessage({ event: _this._name, payload: payload }); });
    };
    BroadcastChannel.prototype.broadcastFrom = function (socket, payload) {
        var _this = this;
        var sockets = this._database.query(function (doc) { return doc.clientId !== socket.clientId; });
        sockets.forEach(function (doc) { return doc.doc.onMessage({ event: _this._name, payload: payload }); });
    };
    BroadcastChannel.prototype.handleEvent = function (data, callback) {
        if (data.event === this._name)
            callback(data.payload);
    };
    return BroadcastChannel;
}());
exports.BroadcastChannel = BroadcastChannel;
