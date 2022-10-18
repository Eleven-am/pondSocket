import { DomWatcher } from "./domWatcher";
import { Channel } from "./channel";
import { LiveEvent } from "../pondLive";
declare type Response = ((Omit<LiveEvent, 'type' | 'dataId'> & {
    event?: string;
}) | null);
export declare type HandlerCallback<GenericEvent extends Event = Event> = (event: GenericEvent, element: HTMLElement, routerPath: string, eventType: string) => Promise<Response> | Response;
export declare type HandlerFunction<GenericEvent extends Event = Event> = (selector: string, event: string, callback: HandlerCallback<GenericEvent>) => void;
export declare const pondEventHandler: (channel: Channel, watcher: DomWatcher) => (selector: string, event: string, callback: HandlerCallback) => void;
export {};
