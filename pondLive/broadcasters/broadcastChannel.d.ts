import {Subscription} from "../../pondBase";
import {LiveSocket} from "../emitters";

export interface BroadcastEvent<ContextType extends Object = any> {}

export declare class BroadcastChannel<ContextType extends Object, InnerData extends Object = any> {
    constructor(initialData: InnerData);

    /**
     * The current data of the channel\
     * This is not the data last data broadcasted,
     * but extra helper data that is assigned to the channel
     */
    get channelData(): Readonly<InnerData>;

    /**
     * @desc Assigns data to the channel, this will not be broadcasted
     * @param assigns - The data to assign to the channel
     */
    assign(assigns: Partial<InnerData>): void;

    /**
     * @desc Subscribes a socket to the channel
     * @param socket - The socket to subscribe
     */
    subscribe(socket: LiveSocket<any>): Subscription;

    /**
     * @desc Broadcasts an event to all sockets subscribed to the channel
     * @param payload - The event to broadcast
     */
    broadcast(payload: ContextType): void;

    /**
     * @desc Broadcasts an event to all sockets except the one that sent the event
     * @param socket - The socket sending the event
     * @param payload - The event to broadcast
     */
    broadcastFrom(socket: LiveSocket<any>, payload: ContextType): void;

    /**
     * @desc Handles the reception of an event from a channel within the component
     * @param data - The data of the event
     * @param callback - The callback to call when the event is handled
     */
    handleEvent(data: BroadcastEvent, callback: (payload: ContextType) => void): void;
}
