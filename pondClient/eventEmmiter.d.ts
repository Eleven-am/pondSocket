import { Channel } from "./channel";
import { LiveEvent } from "../pondLive";
export declare const emitEvent: (event: string, data: any, element?: Element) => void;
export declare const dispatchEvent: (channel: Channel, element: Element, listener: string, event?: Event) => void;
export declare const broadcaster: (channel: Channel, path: string, data: LiveEvent) => void;
export declare const streamLinedBroadcaster: (channel: Channel, event: string, data: LiveEvent) => void;
