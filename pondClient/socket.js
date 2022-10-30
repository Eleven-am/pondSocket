"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondClient = void 0;
const channel_1 = require("./channel");
const pondSocket_1 = require("../pondSocket");
const pondBase_1 = require("../pondBase");
class PondClient {
    constructor(endpoint, params) {
        let address;
        try {
            address = new URL(endpoint);
        }
        catch (e) {
            address = new URL(window.location.toString());
            address.pathname = endpoint;
        }
        const query = new URLSearchParams(params);
        address.search = query.toString();
        const protocol = address.protocol === "https:" ? "wss:" : "ws:";
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
    getState() {
        return this._socketState;
    }
    /**
     * @desc Connects to the server and returns the socket.
     */
    connect(backoff = 1) {
        const socket = new WebSocket(this.address.toString());
        const sub = this._receiver.subscribe((message) => {
            socket.send(JSON.stringify(message));
        });
        socket.onopen = () => {
            this._socketState = "OPEN";
        };
        socket.onclose = () => {
            this._socketState = "CLOSED";
            sub.unsubscribe();
        };
        socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            this._broadcaster.publish(data);
        };
        socket.onerror = () => {
            this._socketState = "CLOSED";
            sub.unsubscribe();
            setTimeout(() => {
                this.connect(backoff * 2);
            }, backoff * 1000);
        };
        this._socket = socket;
    }
    /**
     * @desc Disconnects the socket from the server.
     */
    disconnect() {
        var _a;
        Object.values(this._channels).forEach(channel => channel.leave());
        this._socketState = "CLOSED";
        this._broadcaster.clear();
        this._receiver.clear();
        (_a = this._socket) === null || _a === void 0 ? void 0 : _a.close();
        this._channels = {};
    }
    /**
     * @desc An event that is triggered when the socket receives a message.
     * @param event - The event to subscribe to.
     * @param callback - The callback to be called when the event is triggered.
     */
    onMessage(event, callback) {
        return this._broadcaster.subscribe(data => {
            if (data.action === pondSocket_1.ServerActions.MESSAGE && data.event === event)
                callback(data.payload);
        });
    }
    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    createChannel(name, params) {
        if (this._channels[name])
            return this._channels[name];
        const channel = new channel_1.Channel(name, this._broadcaster, this._receiver, params);
        this._channels[name] = channel;
        return channel;
    }
}
exports.PondClient = PondClient;
