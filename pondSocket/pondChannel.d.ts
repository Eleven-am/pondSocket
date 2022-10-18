import {Anything, BaseClass, default_t, PondPath, RejectPromise, Subscription} from "../pondBase";
import {Channel, ChannelEvent, ChannelInfo} from "./channel";
import {IncomingChannelMessage, IncomingJoinMessage, PondMessage, PondResponseAssigns, SocketCache} from "./types";
import {PondResponse} from "./pondResponse";

export declare type ChannelHandler = (req: IncomingJoinMessage, res: PondResponse, channel: Channel) => void;
export declare type Subscriber = (event: ChannelEvent) => Anything<RejectPromise<{
    event: string;
    channelName: string;
}> | boolean>;

export declare class PondChannel extends BaseClass {
    readonly path: PondPath;
    /**
     * @desc Gets a list of all the channels in the endpoint.
     */
    get info(): ChannelInfo[];

    /**
     * @desc A listener for a channel event
     * @param event - The event to listen for, can be a regex
     * @param callback - The callback to call when the event is received
     */
    on(event: PondPath, callback: (req: IncomingChannelMessage, res: PondResponse, channel: Channel) => void): void;

    /**
     * @desc Add new user to channel
     * @param user - The user to add to the channel
     * @param channelName - The name of the channel
     * @param joinParams - The params to join the channel with
     */
    addUser(user: SocketCache, channelName: string, joinParams: default_t): Promise<void>;

    /**
     * @desc Sends a message to a channel in the endpoint.
     * @param channelName - The name of the channel to send the message to.
     * @param event - The event to send the message with.
     * @param message - The message to send.
     */
    broadcastToChannel(channelName: string, event: string, message: PondMessage): void;

    /**
     * @desc Closes a client connection to a channel in the endpoint.
     * @param channelName - The name of the channel to close the connection to.
     * @param clientId - The id of the client to close the connection to.
     */
    closeFromChannel(channelName: string, clientId: string | string[]): void;

    /**
     * @desc Modify the presence of a client in a channel on the endpoint.
     * @param channelName - The name of the channel to modify the presence of.
     * @param clientId - The id of the client to modify the presence of.
     * @param assigns - The assigns to modify the presence with.
     */
    modifyPresence(channelName: string, clientId: string, assigns: PondResponseAssigns): void;

    /**
     * @desc Gets the information of the channel
     * @param channelName - The name of the channel to get the information of.
     */
    getChannelInfo(channelName: string): ChannelInfo;

    /**
     * @desc Sends a message to the channel
     * @param channelName - The name of the channel to send the message to.
     * @param clientId - The clientId to send the message to, can be an array of clientIds
     * @param event - The event to send the message to
     * @param message - The message to send
     */
    send(channelName: string, clientId: string | string[], event: string, message: default_t): void;

    /**
     * @desc Searches for a channel in the endpoint.
     * @param query - The query to search for.
     */
    findChannel(query: (channel: Channel) => boolean): Channel | null;

    /**
     * @desc Subscribes a function to a channel in the endpoint.
     * @param channelName - The name of the channel to subscribe to.
     * @param callback - The function to subscribe to the channel.
     */
    subscribe(channelName: string, callback: Subscriber): Subscription;

    /**
     * @desc removes a user from all channels
     * @param clientId - The id of the client to remove
     */
    removeUser(clientId: string): void;
}
