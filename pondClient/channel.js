"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
const pondSocket_1 = require("../pondSocket");
const pondBase_1 = require("../pondBase");
class Channel {
    constructor(name, receiver, broadcaster, params) {
        this._name = name;
        this._joinParams = params || {};
        this._broadcaster = broadcaster;
        this._connection = new pondBase_1.Subject(false);
        this._receiver = new pondBase_1.Broadcast();
        this._presence = new pondBase_1.Subject({
            action: pondBase_1.PondBaseActions.REMOVE_FROM_POND,
            change: null,
            presence: []
        });
        this._subscription = receiver.subscribe(data => {
            if (data.channelName === name) {
                this._receiver.publish(data);
                this._connection.publish(true);
            }
        });
    }
    /**
     * @desc Connects to the channel.
     */
    join() {
        const joinMessage = {
            action: pondSocket_1.ClientActions.JOIN_CHANNEL,
            channelName: this._name,
            event: pondSocket_1.ClientActions.JOIN_CHANNEL,
            payload: this._joinParams
        };
        this._receiver.subscribe(data => {
            if (data.action === pondSocket_1.ServerActions.PRESENCE) {
                const event = data.event;
                const presenceData = data.payload;
                this._presence.publish({
                    action: event,
                    change: presenceData.change,
                    presence: presenceData.presence
                });
            }
        });
        this._broadcaster.publish(joinMessage);
    }
    /**
     * @desc Disconnects from the channel.
     */
    leave() {
        const leaveMessage = {
            action: pondSocket_1.ClientActions.LEAVE_CHANNEL,
            channelName: this._name,
            event: pondSocket_1.ClientActions.LEAVE_CHANNEL,
            payload: {}
        };
        this._broadcaster.publish(leaveMessage);
        this._connection.publish(false);
        this._subscription.unsubscribe();
        this._connection.clear();
        this._receiver.clear();
        this._presence.clear();
    }
    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    onMessage(event, callback) {
        return this._receiver.subscribe(data => {
            if (data.action === pondSocket_1.ServerActions.MESSAGE && data.event === event)
                callback(data.payload);
        });
    }
    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcast(event, payload) {
        const message = {
            action: pondSocket_1.ClientActions.BROADCAST, channelName: this._name, payload: payload, event: event
        };
        this._broadcaster.publish(message);
    }
    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcastFrom(event, payload) {
        const message = {
            action: pondSocket_1.ClientActions.BROADCAST_FROM, channelName: this._name, payload: payload, event: event
        };
        this._broadcaster.publish(message);
    }
    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    sendMessage(event, payload, recipient) {
        const message = {
            action: pondSocket_1.ClientActions.SEND_MESSAGE_TO_USER,
            channelName: this._name,
            payload: payload,
            event: event,
            addresses: recipient
        };
        this._broadcaster.publish(message);
    }
    /**
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    updatePresence(presence) {
        const message = {
            action: pondSocket_1.ClientActions.UPDATE_PRESENCE,
            channelName: this._name,
            payload: presence,
            event: pondSocket_1.ClientActions.UPDATE_PRESENCE
        };
        this._broadcaster.publish(message);
    }
    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    onJoin(callback) {
        return this._presence.subscribe(data => {
            if (data.action === pondBase_1.PondBaseActions.ADD_TO_POND)
                callback(data.change);
        });
    }
    /**
     * @desc Detects when clients leave the channel.
     * @param callback - The callback to call when a client leaves the channel.
     */
    onLeave(callback) {
        let presence = [];
        return this._presence.subscribe(data => {
            if (data.action === pondBase_1.PondBaseActions.REMOVE_FROM_POND) {
                const missing = presence.filter(p => !data.presence.find(x => x.id === p.id));
                missing.forEach(p => callback(p));
            }
            presence = data.presence;
        });
    }
    /**
     * @desc Gets the current presence state of the channel.
     */
    get presence() {
        return this._presence.value.presence;
    }
    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    onConnectionChange(callback) {
        return this._connection.subscribe(data => {
            callback(data);
        });
    }
}
exports.Channel = Channel;
