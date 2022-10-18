import {Subscription} from "./pubSub";
import {PondBaseActions} from "./enums";

export declare class PondDocument<T> {
    get id(): string;

    get doc(): T;

    /**
     * @desc Removes the document from the collection
     */
    removeDoc(): T;

    /**
     * @desc Updates the document in the collection
     * @param value - the new value of the document
     */
    updateDoc(value: T): void;
}

export declare class PondBase<T> {
    /**
     * @desc Get the number of documents
     */
    get size(): number;

    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    get(key: string): PondDocument<T> | null;

    /**
     * @desc Set a document to the database
     * @param value - The value of the document
     */
    set(value: T): PondDocument<T>;

    /**
     * @desc Update a document by key
     * @param key - The key of the document
     * @param value - The new value of the document
     */
    update(key: string, value: T): PondDocument<T>;

    /**
     * @desc Create a pond document
     * @param creator - The creator function of the pond document
     */
    createDocument(creator: (doc: Readonly<PondDocument<undefined>>) => T): PondDocument<T>;

    /**
     * @desc Merge the pond with another pond
     * @param pond - The pond to merge with
     */
    merge(pond: PondBase<T>): PondBase<T>;

    /**
     * @desc Generate a generator of all documents
     */
    generate(): Generator<T>;

    /**
     * @desc Query documents by a query function
     * @param query - The query function
     */
    query(query: (doc: T) => boolean): PondDocument<T>[];

    /**
     * @desc Query documents by a query function on the document's key
     * @param query - The query function
     */
    queryById(query: (id: string) => boolean): PondDocument<T>[];

    /**
     * @desc Query documents by a list of keys
     * @param keys - The keys of the documents
     */
    queryByKeys(keys: string[]): PondDocument<T>[];

    /**
     * @desc Reduces the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    reduce<U>(reducer: (accumulator: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;

    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    find(query: (doc: T) => boolean): PondDocument<T> | null;

    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    map<U>(mapper: (doc: T) => U): U[];

    /**
     * @desc Clear the pond
     */
    clear(): void;

    /**
     * @desc Subscribe to change on all documents
     * @param handler - The handler function of the event
     */
    subscribe(handler: (docs: T[], change: T | null, action: PondBaseActions) => void): Subscription;

    /**
     * @desc Get all the documents in an array
     */
    toArray(): PondDocument<T>[];
}
