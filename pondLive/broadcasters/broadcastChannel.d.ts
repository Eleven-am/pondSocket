import { Subscription } from "../../pondBase";
import { LiveSocket } from "../emitters";
export interface BroadcastEvent<ContextType extends Object = any> {
    event: string;
    payload: ContextType;
}
export declare class BroadcastChannel<ContextType extends Object, InnerData extends Object = any> {
    private readonly _name;
    private readonly _database;
    constructor(initialData: InnerData);
    private _channelData;
    get channelData(): Readonly<InnerData>;
    assign(assigns: Partial<InnerData>): void;
    subscribe(socket: LiveSocket<any>): Subscription;
    broadcast(payload: ContextType): void;
    broadcastFrom(socket: LiveSocket<any>, payload: ContextType): void;
    handleEvent(data: BroadcastEvent, callback: (payload: ContextType) => void): void;
}
