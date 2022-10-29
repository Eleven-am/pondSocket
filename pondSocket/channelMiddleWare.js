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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMiddleware = void 0;
var pondResponse_1 = require("./pondResponse");
var ChannelMiddleware = /** @class */ (function () {
    function ChannelMiddleware() {
        this._handlers = [];
    }
    ChannelMiddleware.prototype.use = function (handler) {
        this._handlers.push(handler);
    };
    ChannelMiddleware.prototype.merge = function (second) {
        var _a;
        (_a = this._handlers).push.apply(_a, __spreadArray([], __read(second._handlers), false));
    };
    ChannelMiddleware.prototype.run = function (data, action) {
        var middlewareFunctions = this._handlers.concat();
        var request = {
            channelName: data.channel.name,
            message: data.payload,
            event: data.event,
            client: data.client
        };
        var response = new pondResponse_1.ChannelResponse(data.client.clientId, data.channel, action);
        var next = function () {
            var handler = middlewareFunctions.shift();
            if (!handler)
                return action(false);
            void handler(request, response, data.channel);
            if (response.hasExecuted)
                return;
            next();
        };
        next();
    };
    return ChannelMiddleware;
}());
exports.ChannelMiddleware = ChannelMiddleware;
