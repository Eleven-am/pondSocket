import {PondDocument} from "./pondBase";

declare type ExtractSameValueType<A, B, C extends keyof A> = {
    [K in keyof B]: B[K] extends A[C] ? A[C] extends B[K] ? K : never : never;
}[keyof B];

export declare class SimpleBase<Type extends object> {
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
     * @desc Get all the documents in an array
     */
    toArray(): PondDocument<Type>[];
}

export {};
