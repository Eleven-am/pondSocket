"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMiddleware = void 0;
const pondResponse_1 = require("./pondResponse");
class ChannelMiddleware {
    constructor() {
        this._handlers = [];
    }
    use(handler) {
        this._handlers.push(handler);
    }
    merge(second) {
        this._handlers.push(...second._handlers);
    }
    run(data, action) {
        const middlewareFunctions = this._handlers.concat();
        const request = {
            channelName: data.channel.name,
            message: data.payload,
            event: data.event,
            client: data.client
        };
        const response = new pondResponse_1.ChannelResponse(data.client.clientId, data.channel, action);
        const next = () => {
            const handler = middlewareFunctions.shift();
            if (!handler)
                return action(false);
            void handler(request, response, data.channel);
            if (response.hasExecuted)
                return;
            next();
        };
        next();
    }
}
exports.ChannelMiddleware = ChannelMiddleware;
