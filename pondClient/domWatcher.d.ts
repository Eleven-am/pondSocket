declare type Watcher = (element: HTMLElement, value: string | null) => void;
declare type TagName = keyof HTMLElementTagNameMap;
declare type ModificationWatcher = {
    onAdd?: Watcher;
    onUpdated?: Watcher;
    onRemove?: Watcher;
};
export declare class DomWatcher {
    private readonly _observer;
    private readonly _modifiers;
    constructor();
    watch(selector: string, object: ModificationWatcher): void;
    unwatch(selector: string): void;
    isWatching(selector: string): boolean;
    addEventListener<S extends Event>(selector: string, event: string, callback: (node: HTMLElement, event: S) => void): void;
    delegateEvent<S extends Event>(tagName: TagName, event: string, callback: (node: HTMLElement, event: S) => void): void;
    delegateSelectorEvent<S extends Event>(selector: string, event: string, callback: (node: HTMLElement, event: S) => void): void;
    shutdown(): void;
    private _addNewElement;
}
export {};
