import {NewUser, PondAssigns, PondChannelData, PondMessage, PondPresence, ServerMessage} from "./types";
import {PondSenders} from "./enums";

export interface ChannelInfo {
    name: string;
    channelData: PondChannelData;
    presence: PondPresence[];
    assigns: Record<string, PondAssigns>;
}

export interface ChannelEvent extends ServerMessage {
    clientId: string | PondSenders;
    clientAssigns: PondAssigns;
    clientPresence: PondPresence;
    channel: Channel;
}

export declare class Channel extends BaseClass {
    readonly name: string;

    /**
     * @desc Returns the channel info
     */
    get info(): Readonly<ChannelInfo>;

    /**
     * @desc Gets the channel's data
     */
    get data(): Readonly<PondChannelData>;

    /**
     * @desc Sets the channel's data
     * @param data
     */
    set data(data: PondChannelData);

    /**
     * @desc Gets the channel's presence
     */
    get presence(): PondPresence[];

    /**
     * @desc Gets the channel's assigns
     */
    get assigns(): Record<string, PondAssigns>;

    /**
     * @desc Checks if a user exists in the channel
     * @param clientId - The clientId of the user
     */
    hasUser(clientId: string): boolean;

    /**
     * @desc Adds a new user to the channel
     * @param user - The user to add to the channel
     */
    addUser(user: NewUser): void;

    /**
     * @desc Gets a user's information
     * @param clientId - The clientId of the user
     */
    getUserInfo(clientId: string): {
        presence: PondPresence; assigns: PondAssigns;
    } | null;

    /**
     * @desc Removes a user or group of users from the channel
     * @param clientIds - The clientIds of the users to remove
     */
    removeUser(clientIds: string | string[]): void;

    /**
     * @desc Broadcasts a message to all users in the channel
     * @param event - The event name
     * @param message - The message to send
     * @param sender - The sender of the message
     */
    broadcast(event: string, message: PondMessage, sender?: PondSenders | string): void;

    /**
     * @desc Broadcasts a message to all users in the channel except the sender
     * @param event - The event name
     * @param message - The message to send
     * @param clientId - The client id of the sender
     */
    broadcastFrom(event: string, message: PondMessage, clientId: string): void;

    /**
     * @desc Sends a message to a specific user or group of users
     * @param event - The event name
     * @param clientId - The client id of the user to send the message to
     * @param message - The message to send
     * @param sender - The client id of the sender
     */
    sendTo(event: string, message: PondMessage, sender: string, clientId: string | string[]): void;

    /**
     * @desc Subscribes to a channel event
     */
    subscribe(callback: (message: ChannelEvent) => Anything<RejectPromise<{
        event: string; channelName: string;
    }> | boolean>): Subscription;

    /**
     * @desc Updates the state of a user in the channel
     * @param clientId - The clientId of the user to update
     * @param presence - The new presence of the user
     * @param assigns - The new assigns of the user
     */
    updateUser(clientId: string, presence: PondPresence, assigns: PondAssigns): void;

    /**
     * @desc Subscribes to a channel event
     * @param clientId - The client id of the user to send the message to
     * @param callback - The callback to call when a message is received
     */
    subscribeToMessages(clientId: string, callback: (message: ServerMessage) => void): Subscription;
}
