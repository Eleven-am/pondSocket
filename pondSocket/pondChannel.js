"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondChannel = void 0;
const pondBase_1 = require("../pondBase");
const channel_1 = require("./channel");
const enums_1 = require("./enums");
const pondResponse_1 = require("./pondResponse");
const channelMiddleWare_1 = require("./channelMiddleWare");
class PondChannel extends pondBase_1.BaseClass {
    constructor(path, handler) {
        super();
        this._channels = new pondBase_1.PondBase();
        this._handler = handler;
        this.path = path;
        this._subscriptions = {};
        this._middleware = new channelMiddleWare_1.ChannelMiddleware();
    }
    /**
     * @desc Gets a list of all the channels in the endpoint.
     */
    get info() {
        return this._channels.map(channel => channel.info);
    }
    /**
     * @desc Sends a message to a client
     * @param socket - The socket to send the message to
     * @param message - The message to send
     */
    static _sendMessage(socket, message) {
        socket.send(JSON.stringify(message));
    }
    /**
     * @desc A listener for a channel event
     * @param event - The event to listen for, can be a regex
     * @param callback - The callback to call when the event is received
     */
    on(event, callback) {
        this._buildHandler(event, callback);
    }
    /**
     * @desc Add new user to channel
     * @param user - The user to add to the channel
     * @param channelName - The name of the channel
     * @param joinParams - The params to join the channel with
     */
    addUser(user, channelName, joinParams) {
        const document = this._getChannel(channelName);
        const channel = document.doc;
        const resolver = (newAssigns, message) => {
            const { assigns, presence, channelData } = newAssigns;
            this._subscriptions[user.clientId] = this._subscriptions[user.clientId] || [];
            const sub = channel.subscribeToMessages(user.clientId, (event) => {
                PondChannel._sendMessage(user.socket, event);
            });
            this._subscriptions[user.clientId].push({ name: channelName, sub });
            channel.addUser({
                presence: presence,
                assigns: assigns,
                channelData: channelData,
                client: user
            });
            if (message)
                channel.sendTo(message.event, message.payload, enums_1.PondSenders.POND_CHANNEL, [user.clientId]);
        };
        const response = new pondResponse_1.PondChannelResponse(user, resolver);
        const resolved = this.generateEventRequest(this.path, channelName);
        if (resolved === null) {
            document.removeDoc();
            return response.reject(`Invalid channel name: ${channelName}`);
        }
        const request = Object.assign(Object.assign({ joinParams }, resolved), { clientId: user.clientId, channelName, clientAssigns: user.assigns });
        this._handler(request, response, channel);
        if (channel.presence.length === 0)
            document.removeDoc();
        if (!response.isResolved)
            throw new Error("PondChannel: Response was not resolved");
    }
    /**
     * @desc Sends a message to a channel in the endpoint.
     * @param channelName - The name of the channel to send the message to.
     * @param event - The event to send the message with.
     * @param message - The message to send.
     */
    broadcastToChannel(channelName, event, message) {
        this._execute(channelName, channel => {
            channel.broadcast(event, message, enums_1.PondSenders.POND_CHANNEL);
        });
    }
    /**
     * @desc Closes a client connection to a channel in the endpoint.
     * @param channelName - The name of the channel to close the connection to.
     * @param clientId - The id of the client to close the connection to.
     */
    closeFromChannel(channelName, clientId) {
        this._execute(channelName, channel => {
            this._removeSubscriptions(clientId, channelName);
            channel.removeUser(clientId);
        });
    }
    /**
     * @desc Modify the presence of a client in a channel on the endpoint.
     * @param channelName - The name of the channel to modify the presence of.
     * @param clientId - The id of the client to modify the presence of.
     * @param assigns - The assigns to modify the presence with.
     */
    modifyPresence(channelName, clientId, assigns) {
        this._execute(channelName, channel => {
            channel.updateUser(clientId, assigns.presence || {}, assigns.assigns || {});
        });
    }
    /**
     * @desc Gets the information of the channel
     * @param channelName - The name of the channel to get the information of.
     */
    getChannelInfo(channelName) {
        return this._execute(channelName, channel => {
            return channel.info;
        });
    }
    /**
     * @desc Sends a message to the channel
     * @param channelName - The name of the channel to send the message to.
     * @param clientId - The clientId to send the message to, can be an array of clientIds
     * @param event - The event to send the message to
     * @param message - The message to send
     */
    send(channelName, clientId, event, message) {
        const clients = Array.isArray(clientId) ? clientId : [clientId];
        this._execute(channelName, channel => {
            channel.sendTo(event, message, enums_1.PondSenders.POND_CHANNEL, clients);
        });
    }
    /**
     * @desc Searches for a channel in the endpoint.
     * @param channelName - The name of the channel to search for.
     */
    getChannel(channelName) {
        var _a;
        return ((_a = this._channels.get(channelName)) === null || _a === void 0 ? void 0 : _a.doc) || null;
    }
    /**
     * @desc removes a user from all channels
     * @param clientId - The id of the client to remove
     */
    removeUser(clientId) {
        if (this._subscriptions[clientId]) {
            this._subscriptions[clientId].forEach(doc => doc.sub.unsubscribe());
            delete this._subscriptions[clientId];
            for (const channel of this._channels)
                if (channel.doc.hasUser(clientId))
                    channel.doc.removeUser(clientId);
        }
    }
    /**
     * @desc Executes a function on a channel in the endpoint.
     * @param channelName - The name of the channel to execute the function on.
     * @param handler - The function to execute on the channel.
     * @private
     */
    _execute(channelName, handler) {
        const newChannel = this.getChannel(channelName);
        if (newChannel)
            return handler(newChannel);
        throw new Error(`Channel ${channelName} does not exist`);
    }
    /**
     * @desc Creates a new channel in the endpoint.
     * @param channelName - The name of the channel to create.
     * @private
     */
    _getChannel(channelName) {
        return this._channels.getOrCreate(channelName, doc => {
            return new channel_1.Channel(channelName, this._middleware, doc.removeDoc.bind(doc));
        });
    }
    /**
     * @desc Removes a subscription from a user
     * @param clientId - The id of the client to remove the subscription from
     * @param channelName - The name of the channel to remove the subscription from
     * @private
     */
    _removeSubscriptions(clientId, channelName) {
        const clients = Array.isArray(clientId) ? clientId : [clientId];
        clients.forEach(client => {
            const subs = this._subscriptions[client];
            if (subs) {
                const sub = subs.find(s => s.name === channelName);
                if (sub) {
                    sub.sub.unsubscribe();
                    subs.splice(subs.indexOf(sub), 1);
                }
            }
        });
    }
    /**
     * @desc Builds an event handler for a channel
     * @param event - The event to build the handler for
     * @param callback - The callback to build the handler for
     * @private
     */
    _buildHandler(event, callback) {
        this._middleware.use((data, res, channel) => {
            const info = this.generateEventRequest(event, data.event);
            if (!info)
                return;
            const req = Object.assign(Object.assign({}, data), { params: info.params, query: info.query });
            callback(req, res, channel);
        });
    }
}
exports.PondChannel = PondChannel;
