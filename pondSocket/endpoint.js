"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = void 0;
const enums_1 = require("./enums");
const pondBase_1 = require("../pondBase");
const pondChannel_1 = require("./pondChannel");
const pondResponse_1 = require("./pondResponse");
class Endpoint extends pondBase_1.BaseClass {
    constructor(server, handler) {
        super();
        this._channels = new pondBase_1.SimpleBase();
        this._sockets = new pondBase_1.SimpleBase();
        this._handler = handler;
        this._server = server;
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
     * @desc Accepts a new socket join request to the room provided using the handler function to authorise the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     *
     * @example
     * const channel = endpoint.createChannel('channel:*', (req, res) => {
     *   const isAdmin = req.clientAssigns.admin;
     *   if (!isAdmin)
     *      return res.reject("You are not an admin");
     *
     *   res.accept({
     *      assign: {
     *         admin: true,
     *         joinedDate: new Date()
     *      },
     *      presence: {state: 'online'},
     *      channelData: {private: true}
     *   });
     * });
     *
     * channel.on('ping', (req, res, channel) => {
     *     const users = channel.getPresence();
     *     res.assign({
     *        assign: {
     *           pingDate: new Date(),
     *           users: users.length
     *        }
     *    });
     * })
     */
    createChannel(path, handler) {
        const pondChannel = new pondChannel_1.PondChannel(path, handler);
        this._channels.set(path.toString(), pondChannel);
        return pondChannel;
    }
    /**
     * @desc Authenticates the client to the endpoint
     * @param request - Incoming request
     * @param socket - Incoming socket
     * @param head - Incoming head
     * @param data - Incoming the data resolved from the handler
     */
    authoriseConnection(request, socket, head, data) {
        const doc = this._sockets.createGenericDocument();
        const req = Object.assign(Object.assign({ headers: request.headers }, data), { clientId: doc.id });
        const resolver = (assigns, data) => {
            if (data.error) {
                socket.write(`HTTP/1.1 ${data.error.code} ${data.error.message}\r\n\r\n`);
                return socket.destroy();
            }
            this._server.handleUpgrade(request, socket, head, (ws) => {
                this._server.emit("connection", ws);
                const socketCache = {
                    socket: ws,
                    assigns: assigns
                };
                doc.updateDoc(socketCache);
                this._manageSocket(doc);
                if (data.message) {
                    const newMessage = {
                        action: enums_1.ServerActions.MESSAGE,
                        event: data.message.event,
                        channelName: "SERVER",
                        payload: data.message.payload
                    };
                    Endpoint._sendMessage(ws, newMessage);
                }
            });
        };
        const res = new pondResponse_1.EndpointResponse(resolver);
        this._handler(req, res, this);
    }
    /**
     * @desc Closes a client connection to the endpoint.
     * @param clientId - The id of the client to close the connection to.
     */
    closeConnection(clientId) {
        const message = {
            action: enums_1.ServerActions.CLOSE,
            channelName: "SERVER",
            event: "CLOSED_FROM_SERVER", payload: {}
        };
        const stringifiedMessage = JSON.stringify(message);
        const socketDoc = this._sockets.get(clientId);
        if (socketDoc) {
            socketDoc.doc.socket.send(stringifiedMessage);
            socketDoc.doc.socket.close();
            socketDoc.removeDoc();
        }
    }
    /**
     * @desc Sends a message to a client on the endpoint.
     * @param clientId - The id of the client to send the message to.
     * @param event - The event to send the message with.
     * @param message - The message to send.
     */
    send(clientId, event, message) {
        const newMessage = {
            action: enums_1.ServerActions.MESSAGE,
            channelName: enums_1.PondSenders.ENDPOINT,
            event, payload: message
        };
        const stringifiedMessage = JSON.stringify(newMessage);
        const addresses = Array.isArray(clientId) ? clientId : [clientId];
        addresses.forEach((address) => {
            const socketDoc = this._sockets.get(address);
            if (socketDoc)
                socketDoc.doc.socket.send(stringifiedMessage);
        });
    }
    /**
     * @desc lists all the channels in the endpoint
     */
    listChannels() {
        return this._channels.map(channel => channel.info).flat();
    }
    /**
     * @desc lists all the clients in the endpoint
     */
    listConnections() {
        return this._sockets.map(socket => socket.socket);
    }
    /**
     * @desc Broadcasts a message to all clients in the endpoint.
     * @param event - The event to broadcast.
     * @param message - The message to broadcast.
     */
    broadcast(event, message) {
        const sockets = [...this._sockets.generator()];
        const newMessage = {
            action: enums_1.ServerActions.MESSAGE,
            channelName: enums_1.PondSenders.ENDPOINT,
            event, payload: message
        };
        const stringifiedMessage = JSON.stringify(newMessage);
        sockets.forEach(doc => doc.doc.socket.send(stringifiedMessage));
    }
    /**
     * @desc Searches for a channel in the endpoint.
     * @param name - The name of the channel to search for.
     */
    _findChannel(name) {
        const pond = this._findPondChannel(name);
        if (pond) {
            const channel = pond.doc.getChannel(name);
            if (channel)
                return channel;
        }
        return undefined;
    }
    /**
     * @desc Manages a new socket connection
     * @param cache - The socket cache
     * @private
     */
    _manageSocket(cache) {
        const socket = cache.doc.socket;
        socket.addEventListener("message", (message) => {
            this._readMessage(cache, message.data);
        });
        socket.addEventListener("close", () => {
            for (const channel of this._channels.generator())
                channel.doc.removeUser(cache.id);
            cache.removeDoc();
        });
        socket.addEventListener("error", () => {
            for (const channel of this._channels.generator())
                channel.doc.removeUser(cache.id);
            cache.removeDoc();
        });
    }
    /**
     * @desc Finds a pond channel in the endpoint.
     * @param channelName - The name of the channel to find.
     * @private
     */
    _findPondChannel(channelName) {
        return this._channels.find(channel => this.generateEventRequest(channel.path, channelName) !== null);
    }
    /**
     * @desc Handles a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     * @private
     */
    _readMessage(cache, message) {
        const errorMessage = {
            action: enums_1.ServerActions.ERROR,
            event: "error",
            channelName: enums_1.PondSenders.ENDPOINT,
            payload: {}
        };
        try {
            const data = JSON.parse(message);
            if (!data.action)
                errorMessage.payload = {
                    message: "No action provided"
                };
            else if (!data.channelName)
                errorMessage.payload = {
                    message: "No channel name provided"
                };
            else if (!data.payload)
                errorMessage.payload = {
                    message: "No payload provided"
                };
            else
                this._handleMessage(cache, data);
            if (!this.isObjectEmpty(errorMessage.payload))
                Endpoint._sendMessage(cache.doc.socket, errorMessage);
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                errorMessage.payload = {
                    message: "Invalid JSON"
                };
                Endpoint._sendMessage(cache.doc.socket, errorMessage);
            }
            else if (e instanceof Error) {
                errorMessage.payload = {
                    message: e.message,
                };
                Endpoint._sendMessage(cache.doc.socket, errorMessage);
            }
        }
    }
    /**
     * @desc Deals with a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     */
    _handleMessage(cache, message) {
        switch (message.action) {
            case "JOIN_CHANNEL":
                const pond = this._findPondChannel(message.channelName);
                if (pond) {
                    const user = {
                        clientId: cache.id,
                        socket: cache.doc.socket,
                        assigns: cache.doc.assigns
                    };
                    pond.doc.addUser(user, message.channelName, message.payload);
                }
                else
                    throw new Error(`Channel ${message.channelName} does not exist`);
                break;
            case "LEAVE_CHANNEL":
                this._channelAction(message.channelName, "LEAVE_CHANNEL", channel => {
                    channel.removeUser(cache.id);
                });
                break;
            case "BROADCAST_FROM":
                this._channelAction(message.channelName, message.event, (channel) => {
                    channel.broadcastFrom(message.event, message.payload, cache.id);
                });
                break;
            case "BROADCAST":
                this._channelAction(message.channelName, message.event, (channel) => {
                    channel.broadcast(message.event, message.payload, cache.id);
                });
                break;
            case "SEND_MESSAGE_TO_USER":
                this._channelAction(message.channelName, message.event, (channel) => {
                    if (!message.addresses || message.addresses.length === 0)
                        throw new Error(`No addresses provided`);
                    channel.sendTo(message.event, message.payload, cache.id, message.addresses);
                });
                break;
            case "UPDATE_PRESENCE":
                this._channelAction(message.channelName, "UPDATE_PRESENCE", (channel) => {
                    var _a, _b;
                    channel.updateUser(cache.id, ((_a = message.payload) === null || _a === void 0 ? void 0 : _a.presence) || {}, ((_b = message.payload) === null || _b === void 0 ? void 0 : _b.assigns) || {});
                });
                break;
        }
    }
    /**
     * @desc Handles a channel action by finding the channel and executing the callback.
     * @param channelName - The name of the channel to find.
     * @param event - The event to execute.
     * @param action - The action to execute.
     * @private
     */
    _channelAction(channelName, event, action) {
        const channel = this._findChannel(channelName);
        if (!channel)
            throw new Error(`Channel ${channelName} does not exist`);
        try {
            return action(channel);
        }
        catch (e) {
            throw new Error(`Error while executing event '${event}' on channel '${channelName}': ${e.message}`);
        }
    }
}
exports.Endpoint = Endpoint;
