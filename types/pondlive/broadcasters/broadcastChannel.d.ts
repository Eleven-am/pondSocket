import {Subscription} from "../../pondbase";
import {LiveSocket} from "../emitters";

export interface BroadcastEvent<ContextType extends Object = any> {
    event: string;
    payload: ContextType;
}

export declare class BroadcastChannel<ContextType extends Object, InnerData extends Object = any> {
    constructor(initialData: InnerData);

    /**
     * @desc The current data of the channel
     */
    get channelData(): Readonly<InnerData>;

    /**
     * @desc Assigns new data to the channel
     * @param assigns - the new data to assign
     */
    assign(assigns: Partial<InnerData>): void;

    /**
     * @desc Subscribes to the channel
     * @param socket - the socket to subscribe with
     */
    subscribe(socket: LiveSocket<any>): Subscription;

    /**
     * @desc Broadcasts an event to all subscribers
     * @param payload - the payload to broadcast
     */
    broadcast(payload: ContextType): void;

    /**
     * @desc Broadcasts an event to all subscribers except the sender
     * @param socket - the socket to exclude
     * @param payload - the payload to broadcast
     */
    broadcastFrom(socket: LiveSocket<any>, payload: ContextType): void;

    /**
     * @desc Handles a broadcast event emitted by this channel
     * @param data - the data of the event
     * @param callback - the callback to run when the event is handled
     */
    handleEvent(data: BroadcastEvent, callback: (payload: ContextType) => void): void;
}
