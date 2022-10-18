import { PondDocument } from "./pondBase";
import { Subscription } from "./pubSub";
import { PondBaseActions } from "./enums";
declare type ExtractSameValueType<A, B, C extends keyof A> = {
    [K in keyof B]: B[K] extends A[C] ? A[C] extends B[K] ? K : never : never;
}[keyof B];
export declare class SimpleBase<Type> {
    private readonly _db;
    private readonly _broadcast;
    constructor();
    /**
     * @desc Get the number of documents
     */
    get size(): number;
    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    get(key: string): PondDocument<Type> | null;
    /**
     * @desc Set a document to the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    set(key: string, value: Type): PondDocument<Type>;
    /**
     * @desc Upsert a document to the database
     * @param key - The key of the document
     * @param creator - The creator function
     */
    getOrCreate(key: string, creator: (doc: PondDocument<Type>) => Type): PondDocument<Type>;
    /**
     * @desc Merge the pond with another pond
     * @param pond - The pond to merge with
     */
    merge(pond: SimpleBase<Type>): SimpleBase<Type>;
    /**
     * @desc Generate a generator of all documents
     */
    generate(): Generator<Type>;
    /**
     * @desc Performs a join between two ponds
     * @param secondPond - The second pond
     * @param key - The key to join on
     * @param secondKey - The key from the second pond to join on
     */
    join<A extends keyof Type, SecondType extends Object, B extends ExtractSameValueType<Type, SecondType, A>>(secondPond: SimpleBase<SecondType>, key: A, secondKey: B): (Type & SecondType)[];
    /**
     * @desc Query documents by a query function
     * @param query - The query function
     */
    query(query: (doc: Type) => boolean): PondDocument<Type>[];
    /**
     * @desc Reduces the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    reduce<U>(reducer: (accumulator: U, currentValue: Type, currentIndex: number) => U, initialValue: U): U;
    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    find(query: (doc: Type) => boolean): PondDocument<Type> | null;
    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    map<U>(mapper: (doc: Type) => U): U[];
    /**
     * @desc Clear the pond
     */
    clear(): void;
    /**
     * @desc Subscribe to change on all documents
     * @param handler - The handler function of the event
     */
    subscribe(handler: (docs: Type[], change: Type | null, action: PondBaseActions) => void): Subscription;
    /**
     * @desc Get all the documents in an array
     */
    toArray(): PondDocument<Type>[];
    /**
     * @desc Delete a document by key
     */
    private _delete;
    /**
     * @desc Retrieve a document from the database
     * @param key - The key of the document
     */
    private _getDocument;
    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @private
     */
    private _createPondDocument;
}
export {};
