export declare class PondDocument<T> {
    constructor(id: string, removeDoc: () => void, updateDoc: (value: T) => PondDocument<T>, getDoc: () => T);

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
    updateDoc(value: T): this;
}

declare type UpdateCallback<T> = (data: {
    oldValue: T | null; currentValue: T | null;
}) => void;

export declare class SimpleBase<T> {
    constructor(callbacks?: UpdateCallback<T>);

    /**
     * @desc Get the number of documents
     */
    get size(): number;

    /**
     * @desc Get all the documents in the database
     */
    get all(): PondDocument<T>[];

    /**
     * @desc Gets all the keys of the database
     */
    get keys(): string[];

    /**
     * @desc Gets all the values of the database
     */
    get values(): T[];

    /**
     * @desc Makes the database iterable
     */
    [Symbol.iterator](): IterableIterator<PondDocument<T>>;

    /**
     * @desc Create a generator for the pond
     */
    generator(): Generator<PondDocument<T>>;

    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    get(key: string): PondDocument<T> | null;

    /**
     * @desc getOrCreate a document in the database
     * @param key - The key of the document
     * @param creator - The function to create the document
     */
    getOrCreate(key: string, creator: (doc: Readonly<PondDocument<T>>) => T): PondDocument<T>;

    /**
     * @desc Upsert a document in the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    upsert(key: string, value: T): PondDocument<T>;

    /**
     * @desc checks if a document exists
     * @param key - The key of the document
     */
    has(key: string): boolean;

    /**
     * @desc Set a document to the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    set(key: string, value: T): PondDocument<T>;

    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    find(query: (doc: T, id: string) => boolean): PondDocument<T> | null;

    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    map<U>(mapper: (doc: T, id: string) => U): U[];

    /**
     * @desc Filters the pond using a query function
     * @param query - The query function
     */
    filter(query: (doc: T, id: string) => boolean): PondDocument<T>[];

    /**
     * @desc Reduce the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    reduce<U>(reducer: (accumulator: U, currentValue: T) => U, initialValue: U): U;

    /**
     * @desc Generate a generic pond document
     * @param id - The id of the document
     */
    createGenericDocument(id?: string): PondDocument<T>;

    /**
     * @desc Gets the raw database
     * @protected
     */
    protected _getDB(): Record<string, T>;
}
