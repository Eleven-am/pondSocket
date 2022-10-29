"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
const pondBase_1 = require("../pondBase");
const enums_1 = require("./enums");
const channelMiddleWare_1 = require("./channelMiddleWare");
class Channel extends pondBase_1.BaseClass {
    constructor(name, middleWare, removeChannel) {
        super();
        this.name = name;
        this._channelPresence = new pondBase_1.PondBase();
        this._channelAssigns = new pondBase_1.SimpleBase();
        this._channelData = {};
        this._middleWare = new channelMiddleWare_1.ChannelMiddleware();
        this.removeChannel = removeChannel;
        this._messages = new pondBase_1.Broadcast();
        this._middleWare.merge(middleWare);
    }
    /**
     * @desc Returns the channel info
     */
    get info() {
        const data = {
            name: this.name, channelData: this.data, presence: this.presence, assigns: this.assigns
        };
        return Object.freeze(data);
    }
    /**
     * @desc Gets the channel's data
     */
    get data() {
        const result = Object.assign({}, this._channelData);
        return Object.freeze(result);
    }
    /**
     * @desc Sets the channel's data
     * @param data
     */
    set data(data) {
        this._channelData = Object.assign(Object.assign({}, this._channelData), data);
    }
    /**
     * @desc Gets the channel's presence
     */
    get presence() {
        return this._channelPresence.map(presence => presence);
    }
    /**
     * @desc Gets the channel's assigns
     */
    get assigns() {
        return this._channelAssigns.map(assigns => assigns);
    }
    /**
     * @desc Gets a user's information
     * @param clientId - The clientId of the user
     */
    getUserInfo(clientId) {
        const client = this._retrieveUser(clientId);
        if (!client)
            return null;
        return {
            presence: client.presence.doc, assigns: client.assigns.doc
        };
    }
    /**
     * @desc Checks if a user exists in the channel
     * @param clientId - The clientId of the user
     */
    hasUser(clientId) {
        return this._channelPresence.has(clientId);
    }
    /**
     * @desc Adds a new user to the channel
     * @param user - The user to add to the channel
     */
    addUser(user) {
        const clientId = user.client.clientId;
        if (this.hasUser(clientId))
            throw new Error(`User with clientId ${clientId} already exists in channel ${this.name}`);
        this._channelPresence.set(clientId, Object.assign(Object.assign({}, user.presence), { id: clientId }));
        this._channelAssigns.set(clientId, user.assigns);
        this._channelData = Object.assign(Object.assign(Object.assign({}, this._channelData), user.channelData));
    }
    /**
     * @desc Removes a user or group of users from the channel
     * @param clientIds - The clientIds of the users to remove
     */
    removeUser(clientIds) {
        const clients = Array.isArray(clientIds) ? clientIds : [clientIds];
        clients.forEach(clientId => {
            const client = this._retrieveUser(clientId);
            if (client) {
                client.presence.removeDoc();
                client.assigns.removeDoc();
            }
        });
        if (this._channelPresence.size === 0)
            this.removeChannel();
    }
    /**
     * @desc Subscribes to the presence changes occuring in the channel
     * @param callback - The callback to call when a presence change occurs
     */
    onPresenceChange(callback) {
        return this._channelPresence.subscribe((docs, change, action) => {
            const message = {
                action: enums_1.ServerActions.PRESENCE,
                payload: { presence: docs, change },
                event: action,
                channelName: this.name,
            };
            callback(message);
        });
    }
    /**
     * @desc Subscribes to the message events occuring in the channel
     * @param callback - The callback to call when a message event occurs
     */
    onMessage(callback) {
        this._middleWare.use(callback);
    }
    /**
     * @desc Updates the state of a user in the channel
     * @param clientId - The clientId of the user to update
     * @param presence - The new presence of the user
     * @param assigns - The new assigns of the user
     */
    updateUser(clientId, presence, assigns) {
        const client = this._retrieveUser(clientId);
        if (client) {
            client.assigns.updateDoc(Object.assign(Object.assign({}, client.assigns.doc), assigns));
            const presenceDoc = Object.assign(Object.assign({}, client.presence.doc), presence);
            if (!this.areEqual(presenceDoc, client.presence.doc))
                client.presence.updateDoc(presenceDoc);
        }
    }
    /**
     * @desc Broadcasts a message to all users in the channel
     * @param event - The event name
     * @param message - The message to send
     * @param sender - The sender of the message
     */
    broadcast(event, message, sender = enums_1.PondSenders.POND_CHANNEL) {
        const client = this._retrieveUser(sender);
        if (!client && !Object.values(enums_1.PondSenders).includes(sender))
            throw new Error(`Client with clientId ${sender} does not exist in channel ${this.name}`);
        const channelEvent = {
            client: {
                clientId: sender,
                clientAssigns: client ? client.assigns.doc : {},
                clientPresence: client ? client.presence.doc : {}
            },
            event: event,
            payload: message,
            channel: this,
        };
        const newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        void this._middleWare.run(channelEvent, hasErrored => {
            if (!hasErrored)
                this._sendToClients(this._channelAssigns.keys, newMessage);
        });
    }
    /**
     * @desc Broadcasts a message to all users in the channel except the sender
     * @param event - The event name
     * @param message - The message to send
     * @param clientId - The client id of the sender
     */
    broadcastFrom(event, message, clientId) {
        const client = this._retrieveUser(clientId);
        if (!client)
            throw new Error(`Client with clientId ${clientId} does not exist in channel ${this.name}`);
        const newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        const channelEvent = {
            client: {
                clientId: clientId,
                clientAssigns: client.assigns.doc,
                clientPresence: client.presence.doc
            },
            event: event,
            payload: message,
            channel: this,
        };
        void this._middleWare.run(channelEvent, hasErrored => {
            if (!hasErrored) {
                const clientIds = this._channelAssigns.keys.filter(id => id !== clientId);
                this._sendToClients(clientIds, newMessage);
            }
        });
    }
    /**
     * @desc Sends a message to a specific user or group of users
     * @param event - The event name
     * @param clientId - The client id of the user to send the message to
     * @param message - The message to send
     * @param sender - The client id of the sender
     */
    sendTo(event, message, sender, clientId) {
        const client = this._retrieveUser(sender);
        if (!client && !Object.values(enums_1.PondSenders).includes(sender))
            throw new Error('Client not found');
        const clientIds = Array.isArray(clientId) ? clientId : [clientId];
        const notFound = clientIds.filter(id => !this._channelAssigns.has(id));
        if (notFound.length > 0)
            throw new Error(`Client(s) with clientId(s) ${notFound.join(', ')} were not found in channel ${this.name}`);
        const newMessage = {
            action: enums_1.ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        };
        const channelEvent = {
            client: {
                clientId: sender,
                clientAssigns: client ? client.assigns.doc : {},
                clientPresence: client ? client.presence.doc : {}
            },
            channel: this,
            event: event,
            payload: message,
        };
        void this._middleWare.run(channelEvent, hasErrored => {
            if (!hasErrored)
                this._sendToClients(clientIds, newMessage);
        });
    }
    /**
     * @desc Subscribes to a channel event, used only by the sockets to subscribe to all events
     * @param clientId - The client id of the user to send the message to
     * @param callback - The callback to call when a message is received
     */
    subscribeToMessages(clientId, callback) {
        const sub1 = this._messages.subscribe(({ clients, message }) => {
            if (clients.includes(clientId))
                callback(message);
        });
        const sub2 = this.onPresenceChange(callback);
        return {
            unsubscribe: () => {
                sub1.unsubscribe();
                sub2.unsubscribe();
            }
        };
    }
    /**
     * @desc Sends a message to a specific user without running the middleware
     * @param event - The event name
     * @param message - The message to send
     * @param client - The client id of the user to send the message to
     * @param action - The action to send
     */
    respondToClient(event, message, client, action = enums_1.ServerActions.MESSAGE) {
        const newMessage = {
            action: action,
            payload: message, event: event,
            channelName: this.name,
        };
        this._sendToClients([client], newMessage);
    }
    /**
     * @desc Sends a message to a specific user or group of users except the sender
     * @param clients - The client id of the user to send the message to
     * @param message - The message to send
     * @private
     */
    _sendToClients(clients, message) {
        void this._messages.publish({ clients, message });
    }
    /**
     * @desc Retrieves a user from the channel
     * @param clientId - The client id of the user to retrieve
     * @private
     */
    _retrieveUser(clientId) {
        const assigns = this._channelAssigns.get(clientId);
        const presence = this._channelPresence.get(clientId);
        if (assigns && presence !== null) {
            return {
                assigns: assigns, presence: presence,
            };
        }
        return null;
    }
}
exports.Channel = Channel;
