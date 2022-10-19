export declare class LiveSocket<LiveContext extends Object> {
    readonly clientId: string;
    readonly componentId: string;

    /**
     * @desc The type of the live socket.
     */
    get isWebsocket(): boolean;

    /**
     * @desc Assigns a value to the live context.
     * @param assign - The data to assign.
     */
    assign(assign: Partial<LiveContext>): void;

    /**
     * @desc Get the current live context.
     */
    get context(): Readonly<LiveContext>;

    /**
     * @desc Emits an event on the browser window.
     * @param event - The event name.
     * @param data - The data to emit.
     */
    emit<EmitData>(event: string, data: EmitData): void;
}
