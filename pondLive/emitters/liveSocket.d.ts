import { ComponentManager } from "../component";
import { LiveRouter } from "./liveRouter";
import { Subscription } from "../../pondBase";
import { Channel, PondResponse } from "../../pondSocket";
import { BroadcastEvent, PeakData } from "../broadcasters";
export declare class LiveSocket<LiveContext extends Object> {
    readonly clientId: string;
    readonly componentId: string;
    private _liveContext;
    private _channel;
    private _timer;
    private readonly _manager;
    private readonly _remove;
    private _subscriptions;
    constructor(clientId: string, manager: ComponentManager, remove: () => void);
    private _isWebsocket;
    /**
     * @desc The type of the live socket.
     */
    get isWebsocket(): boolean;
    /**
     * @desc The live context.
     */
    get context(): Readonly<LiveContext>;
    /**
     * @desc Assigns a value to the live context.
     * @param assign - The data to assign.
     */
    assign(assign: Partial<LiveContext>): void;
    /**
     * @desc Emits an event on the browser window.
     * @param event - The event name.
     * @param data - The data to emit.
     */
    emit<EmitData>(event: string, data: EmitData): void;
    /**
     * @desc Destroys the live socket.
     */
    destroy(): void;
    /**
     * @desc Creates a socket response object.
     */
    createResponse(): {
        response: PondResponse<import("../../pondBase").ResponsePicker.CHANNEL>;
        router: LiveRouter;
    };
    /**
     * @desc Upgrades the live socket to a websocket.
     * @param channel - The websocket channel.
     */
    upgradeToWebsocket(channel: Channel): void;
    /**
     * @desc Handles a message from a subscriber.
     * @param info - The message info.
     */
    onMessage(info: BroadcastEvent): Promise<void>;
    onContextChange(context: PeakData): Promise<void>;
    mountContext(context: PeakData, router: LiveRouter): Promise<void>;
    /**
     * @desc Receives a subscription from a subscriber.
     * @param sub - The subscription.
     */
    addSubscription(sub: Subscription): void;
    /**
     * @desc Creates a socket response object.
     */
    private _createPondResponse;
    /**
     * @desc Clears the timer.
     * @private
     */
    private _clearTimer;
}
