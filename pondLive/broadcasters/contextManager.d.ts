import {LiveSocket} from "../emitters";

export declare class PeakData<DataType extends Object = any> {}

export declare class ContextConsumer<ContextType> {
    /**
     * @desc Assigns data to the context
     * @param socket - The socket assigning the data
     * @param assigns - The data to assign to the context
     */
    assign(socket: LiveSocket<any>, assigns: Partial<ContextType>): void;

    /**
     * @desc Retrieves the current context data
     * @param socket - The socket retrieving the data
     */
    get(socket: LiveSocket<any>): Readonly<ContextType>;

    /**
     * @desc Handles the reception of an event from a channel within the component
     * @param context - The context of the event
     * @param handler - The handler to call when the event is handled
     */
    handleContextChange(context: PeakData, handler: (data: Readonly<ContextType>) => void): void;
}

export declare class ContextProvider {}

export declare type ContextDistributorType<ContextData> = [ContextConsumer<ContextData>, ContextProvider];

export declare function createContext<ContextData extends Object>(initialData: ContextData): ContextDistributorType<ContextData>;

export {};
