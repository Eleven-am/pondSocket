export declare class LiveSocket<LiveContext extends Object> {
    readonly clientId: string;
    readonly componentId: string;

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

}
