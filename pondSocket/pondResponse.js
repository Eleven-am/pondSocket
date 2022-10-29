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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointResponse = exports.PondChannelResponse = exports.ChannelResponse = exports.PondResponse = void 0;
var enums_1 = require("./enums");
var PondResponse = /** @class */ (function () {
    function PondResponse() {
    }
    return PondResponse;
}());
exports.PondResponse = PondResponse;
var ChannelResponse = /** @class */ (function (_super) {
    __extends(ChannelResponse, _super);
    function ChannelResponse(clientId, channel, resolver) {
        var _this = _super.call(this) || this;
        _this._clientId = clientId;
        _this._channel = channel;
        _this._resolver = resolver;
        _this._hasExecuted = false;
        return _this;
    }
    Object.defineProperty(ChannelResponse.prototype, "hasExecuted", {
        get: function () {
            return this._hasExecuted;
        },
        enumerable: false,
        configurable: true
    });
    ChannelResponse.prototype.accept = function (assigns) {
        if (this._hasExecuted)
            throw new Error('Response has already been sent');
        this._hasExecuted = true;
        if (assigns) {
            if (Object.values(enums_1.PondSenders).includes(this._clientId))
                throw new Error('Cannot accept a message sent by the server');
            this._channel.updateUser(this._clientId, assigns.presence || {}, assigns.assigns || {});
            this._channel.data = assigns.channelData || {};
        }
        this._resolver(false);
    };
    ChannelResponse.prototype.reject = function (message, errorCode) {
        if (this._hasExecuted)
            throw new Error('Response has already been sent');
        this._hasExecuted = true;
        message = message || 'Message rejected';
        errorCode = errorCode || 403;
        if (Object.values(enums_1.PondSenders).includes(this._clientId))
            throw new Error('Cannot reject a message sent by the server');
        this._channel.respondToClient('error', { message: message, code: errorCode }, this._clientId, enums_1.ServerActions.ERROR);
        this._resolver(true);
    };
    ChannelResponse.prototype.send = function (event, payload, assigns) {
        if (this._hasExecuted)
            throw new Error('Response has already been sent');
        this._hasExecuted = true;
        if (Object.values(enums_1.PondSenders).includes(this._clientId))
            throw new Error('Cannot reply to a message sent by the server');
        if (assigns) {
            this._channel.updateUser(this._clientId, assigns.presence || {}, assigns.assigns || {});
            this._channel.data = assigns.channelData || {};
        }
        this._channel.respondToClient(event, payload, this._clientId);
        this._resolver(false);
    };
    return ChannelResponse;
}(PondResponse));
exports.ChannelResponse = ChannelResponse;
var PondChannelResponse = /** @class */ (function (_super) {
    __extends(PondChannelResponse, _super);
    function PondChannelResponse(user, handler) {
        var _this = _super.call(this) || this;
        _this._handler = handler;
        _this._user = user;
        _this._executed = false;
        return _this;
    }
    Object.defineProperty(PondChannelResponse.prototype, "isResolved", {
        get: function () {
            return this._executed;
        },
        enumerable: false,
        configurable: true
    });
    PondChannelResponse.prototype.accept = function (assigns) {
        if (this._executed)
            throw new Error('Response has already been sent');
        this._executed = true;
        var newAssigns = this._mergeAssigns(assigns);
        this._handler(newAssigns);
    };
    PondChannelResponse.prototype.reject = function (message, errorCode) {
        if (this._executed)
            throw new Error('Response has already been sent');
        this._executed = true;
        var newMessage = {
            action: enums_1.ServerActions.ERROR,
            event: "JOIN_REQUEST_ERROR",
            channelName: enums_1.PondSenders.POND_CHANNEL,
            payload: {
                message: message || 'Unauthorized join request',
                code: errorCode || 403,
            }
        };
        this._user.socket.send(JSON.stringify(newMessage));
    };
    PondChannelResponse.prototype.send = function (event, payload, assigns) {
        if (this._executed)
            throw new Error('Response has already been sent');
        this._executed = true;
        var newAssigns = this._mergeAssigns(assigns);
        this._handler(newAssigns, { event: event, payload: payload });
    };
    PondChannelResponse.prototype._mergeAssigns = function (assigns) {
        return {
            presence: (assigns === null || assigns === void 0 ? void 0 : assigns.presence) || {},
            channelData: (assigns === null || assigns === void 0 ? void 0 : assigns.channelData) || {},
            assigns: Object.assign({}, this._user.assigns, (assigns === null || assigns === void 0 ? void 0 : assigns.assigns) || {}),
        };
    };
    return PondChannelResponse;
}(PondResponse));
exports.PondChannelResponse = PondChannelResponse;
var EndpointResponse = /** @class */ (function (_super) {
    __extends(EndpointResponse, _super);
    function EndpointResponse(handler) {
        var _this = _super.call(this) || this;
        _this._handler = handler;
        return _this;
    }
    EndpointResponse.prototype.accept = function (assigns) {
        this._handler((assigns === null || assigns === void 0 ? void 0 : assigns.assigns) || {}, {});
    };
    EndpointResponse.prototype.reject = function (message, errorCode) {
        this._handler({}, { error: { message: message || 'Message rejected', code: errorCode || 403 } });
    };
    EndpointResponse.prototype.send = function (event, payload, assigns) {
        this._handler((assigns === null || assigns === void 0 ? void 0 : assigns.assigns) || {}, { message: { event: event, payload: payload } });
    };
    return EndpointResponse;
}(PondResponse));
exports.EndpointResponse = EndpointResponse;
