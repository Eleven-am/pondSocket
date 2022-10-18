import {Channel, ChannelParams} from "./channel";

declare type PondParams = {
    [key: string]: string;
};
declare type PondState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export declare class PondClient {
    constructor(endpoint: string, params?: PondParams);

    /**
     * @desc Connects to the server and returns the socket.
     */
    connect(): this | undefined;

    /**
     * @desc Returns the current state of the socket.
     */
    getState(): PondState;

    /**
     * @desc Creates a channel with the given name and params.
     * @param channel - The name of the channel.
     * @param params - The params to send to the server.
     */
    createChannel(channel: string, params?: ChannelParams): Channel;

    /**
     * @desc An event that is triggered when the socket receives a message.
     * @param callback - The callback to be called when the event is triggered.
     */
    onMessage(callback: (event: string, message: any) => void): void;

    /**
     * @desc Disconnects the socket from the server.
     */
    disconnect(): void;
}

export {};
