import {LiveRouter} from "./liveRouter";
import {PondResponse} from "../../pondsocket";

export declare class LiveSocket<LiveContext extends Object> {
    readonly clientId: string;

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
        response: PondResponse<import("../../pondbase").ResponsePicker.CHANNEL>;
        router: LiveRouter;
    };
}
