import { LiveSocket } from "../emitters";
import { ComponentManager } from "../component";
export interface PeakData<DataType extends Object = any> {
    contextId: string;
    data: Readonly<DataType>;
    listensFor?: string[];
}
interface PeakDataGetter<DataType extends Object = any> {
    get: () => PeakData<DataType>;
}
export declare class ContextDistributor<ContextType extends Object> {
    private readonly _contextId;
    private readonly _managers;
    private readonly _initialValue;
    private readonly _database;
    constructor(initialValue: ContextType);
    subscribe(manager: ComponentManager): void;
    mount(socket: LiveSocket<any>): PeakDataGetter | null;
    assign(socket: LiveSocket<any>, assigns: Partial<ContextType>): void;
    get(socket: LiveSocket<any>): ContextType;
    handleContextChange(context: PeakData<ContextType>, handler: (data: Readonly<ContextType>) => void): void;
    private _generateUnSubscribe;
}
export declare type ContextConsumer<ContextType> = {
    assign: (socket: LiveSocket<any>, assigns: Partial<ContextType>) => void;
    get: (socket: LiveSocket<any>) => Readonly<ContextType>;
    handleContextChange: (context: PeakData, handler: (data: Readonly<ContextType>) => void) => void;
};
export declare type ContextProvider = {
    mount: (socket: LiveSocket<any>) => PeakDataGetter | null;
    subscribe: (manager: ComponentManager) => void;
};
export declare type ContextDistributorType<ContextData> = [ContextConsumer<ContextData>, ContextProvider];
export declare function createContext<ContextData extends Object>(initialData: ContextData): ContextDistributorType<ContextData>;
export {};
