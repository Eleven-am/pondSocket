import {Channel, ChannelParams} from "./channel";
import {PondMessage} from "../pondSocket";

declare type PondParams = {
    [key: string]: string;
};
declare type PondState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export declare class PondClient {

    constructor(endpoint: string, params?: PondParams);

    /**
     * @desc Returns the current state of the socket.
     */
    getState(): PondState;

    /**
     * @desc Connects to the server and returns the socket.
     */
    connect(backoff?: number): void;

    /**
     * @desc Disconnects the socket from the server.
     */
    disconnect(): void;

    /**
     * @desc An event that is triggered when the socket receives a message.
     * @param event - The event to subscribe to.
     * @param callback - The callback to be called when the event is triggered.
     */
    onMessage(event: string, callback: (message: PondMessage) => void): import("../pondBase").Subscription;

    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    createChannel(name: string, params?: ChannelParams): Channel;
}
