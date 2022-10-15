import {LiveSocket} from "../emitters";

export class PeakData<DataType = any> {}

export declare class ContextConsumer<ContextType> {
    /**
     * @desc Assigns a new context to the socket.
     * @param socket The socket to assign the context to.
     * @param assigns The context to assign.
     */
    assign: (socket: LiveSocket<any>, assigns: Partial<ContextType>) => void;

    /**
     * @desc Gets the context from the socket.
     * @param socket The socket to get the context from.
     */
    get: (socket: LiveSocket<any>) => Readonly<ContextType>;

    /**
     * @desc Handles a context change.
     * @param context The context to handle.
     * @param handler The handler to run when the context changes.
     */
    handleContextChange: (context: PeakData, handler: (data: Readonly<ContextType>) => void) => void;
}

export declare class ContextProvider {}

export declare type ContextDistributorType<ContextData> = [ContextConsumer<ContextData>, ContextProvider];

export declare function createContext<ContextData extends Object>(initialData: ContextData): ContextDistributorType<ContextData>;
