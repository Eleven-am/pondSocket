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
exports.PondResponse = void 0;
var pondBase_1 = require("../pondBase");
var PondResponse = /** @class */ (function () {
    function PondResponse(data, assigns, resolver, isChannel) {
        if (isChannel === void 0) { isChannel = true; }
        this._executed = false;
        this._data = data;
        this.resolver = resolver;
        this._assigns = assigns;
        this._isChannel = isChannel;
    }
    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    PondResponse.prototype.send = function (event, payload, assigns) {
        this._message = {
            event: event,
            payload: payload,
        };
        return this._execute(assigns);
    };
    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    PondResponse.prototype.accept = function (assigns) {
        return this._execute(assigns);
    };
    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    PondResponse.prototype.reject = function (message, errorCode) {
        message = message || (this._isChannel ? 'Message' : 'Connection') + ' rejected';
        errorCode = errorCode || 403;
        this._error = {
            errorMessage: message,
            errorCode: errorCode,
        };
        return this._execute({});
    };
    /**
     * @desc Executes the response callback
     * @param assigns - the data to assign to the client
     * @private
     */
    PondResponse.prototype._execute = function (assigns) {
        if (!this._executed) {
            this._executed = true;
            var data = {
                assigns: this._mergeAssigns(assigns),
                message: this._message,
                error: this._error,
            };
            this.resolver(data);
        }
        else
            throw new pondBase_1.PondError('Response has already been sent', 500, this._data);
    };
    /**
     * @desc Merges the assigns with the default assigns
     * @param data - the data to merge
     * @private
     */
    PondResponse.prototype._mergeAssigns = function (data) {
        if (data === undefined)
            return this._assigns;
        var otherAssigns = data;
        var newAssigns = this._assigns;
        var presence = __assign(__assign({}, newAssigns.presence), otherAssigns.presence);
        var channelData = __assign(__assign({}, newAssigns.channelData), otherAssigns.channelData);
        var assigns = __assign(__assign({}, newAssigns.assigns), otherAssigns.assigns);
        return {
            presence: presence,
            channelData: channelData,
            assigns: assigns,
        };
    };
    return PondResponse;
}());
exports.PondResponse = PondResponse;
