import {ClientMessage, PondAssigns, PondMessage, PondPresence, ServerMessage} from "../pondSocket";
import {Broadcast, Subscription} from "../pondBase";

export declare type ChannelParams = PondAssigns;

export declare class Channel {

    constructor(name: string, receiver: Broadcast<ServerMessage, void>, broadcaster: Broadcast<ClientMessage, void>, params?: ChannelParams);

    /**
     * @desc Gets the current presence state of the channel.
     */
    get presence(): PondPresence[];

    /**
     * @desc Connects to the channel.
     */
    join(): void;

    /**
     * @desc Disconnects from the channel.
     */
    leave(): void;

    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    onMessage(event: string, callback: (message: PondMessage) => void): Subscription;

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcast(event: string, payload: PondMessage): void;

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcastFrom(event: string, payload: PondMessage): void;

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    sendMessage(event: string, payload: PondMessage, recipient: string[]): void;

    /**
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    updatePresence(presence: PondPresence): void;

    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    onJoin(callback: (presence: PondPresence) => void): Subscription;

    /**
     * @desc Detects when clients leave the channel.
     * @param callback - The callback to call when a client leaves the channel.
     */
    onLeave(callback: (presence: PondPresence) => void): Subscription;

    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    onConnectionChange(callback: (connected: boolean) => void): Subscription;
}
