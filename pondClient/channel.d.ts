import {Subscription} from "rxjs";
import {PondAssigns, PondMessage, PondPresence} from "../pondSocket";

export declare type ChannelParams = PondAssigns;

export declare class Channel {
    readonly channel: string;

    get isActive(): boolean;

    /**
     * @desc Connects to the channel.
     */
    join(): this;

    /**
     * @desc Disconnects from the channel.
     */
    leave(): void;

    /**
     * @desc Monitors the presence state of the channel.
     * @param callback - The callback to call when the presence state changes.
     */
    onPresenceUpdate(callback: (presence: PondPresence[]) => void): Subscription;

    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    onMessage(callback: (event: string, message: PondMessage) => void): Subscription;

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
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    updatePresence(presence: PondPresence): void;

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    sendMessage(event: string, payload: PondMessage, recipient: string[]): void;

    /**
     * @desc Listens for the connections state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    onConnectionChange(callback: (connected: boolean) => void): import("../pondBase").Subscription;
}
