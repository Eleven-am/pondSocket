"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointResponse = exports.PondChannelResponse = exports.ChannelResponse = exports.PondResponse = void 0;
const enums_1 = require("./enums");
class PondResponse {
}
exports.PondResponse = PondResponse;
class ChannelResponse extends PondResponse {
    constructor(clientId, channel, resolver) {
        super();
        this._clientId = clientId;
        this._channel = channel;
        this._resolver = resolver;
        this._hasExecuted = false;
    }
    get hasExecuted() {
        return this._hasExecuted;
    }
    accept(assigns) {
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
    }
    reject(message, errorCode) {
        if (this._hasExecuted)
            throw new Error('Response has already been sent');
        this._hasExecuted = true;
        message = message || 'Message rejected';
        errorCode = errorCode || 403;
        if (Object.values(enums_1.PondSenders).includes(this._clientId))
            throw new Error('Cannot reject a message sent by the server');
        this._channel.respondToClient('error', { message: message, code: errorCode }, this._clientId, enums_1.ServerActions.ERROR);
        this._resolver(true);
    }
    send(event, payload, assigns) {
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
    }
}
exports.ChannelResponse = ChannelResponse;
class PondChannelResponse extends PondResponse {
    constructor(user, handler) {
        super();
        this._handler = handler;
        this._user = user;
        this._executed = false;
    }
    get isResolved() {
        return this._executed;
    }
    accept(assigns) {
        if (this._executed)
            throw new Error('Response has already been sent');
        this._executed = true;
        const newAssigns = this._mergeAssigns(assigns);
        this._handler(newAssigns);
    }
    reject(message, errorCode) {
        if (this._executed)
            throw new Error('Response has already been sent');
        this._executed = true;
        const newMessage = {
            action: enums_1.ServerActions.ERROR,
            event: "JOIN_REQUEST_ERROR",
            channelName: enums_1.PondSenders.POND_CHANNEL,
            payload: {
                message: message || 'Unauthorized join request',
                code: errorCode || 403,
            }
        };
        this._user.socket.send(JSON.stringify(newMessage));
    }
    send(event, payload, assigns) {
        if (this._executed)
            throw new Error('Response has already been sent');
        this._executed = true;
        const newAssigns = this._mergeAssigns(assigns);
        this._handler(newAssigns, { event: event, payload: payload });
    }
    _mergeAssigns(assigns) {
        return {
            presence: (assigns === null || assigns === void 0 ? void 0 : assigns.presence) || {},
            channelData: (assigns === null || assigns === void 0 ? void 0 : assigns.channelData) || {},
            assigns: Object.assign({}, this._user.assigns, (assigns === null || assigns === void 0 ? void 0 : assigns.assigns) || {}),
        };
    }
}
exports.PondChannelResponse = PondChannelResponse;
class EndpointResponse extends PondResponse {
    constructor(handler) {
        super();
        this._handler = handler;
    }
    accept(assigns) {
        this._handler((assigns === null || assigns === void 0 ? void 0 : assigns.assigns) || {}, {});
    }
    reject(message, errorCode) {
        this._handler({}, { error: { message: message || 'Message rejected', code: errorCode || 403 } });
    }
    send(event, payload, assigns) {
        this._handler((assigns === null || assigns === void 0 ? void 0 : assigns.assigns) || {}, { message: { event: event, payload: payload } });
    }
}
exports.EndpointResponse = EndpointResponse;
