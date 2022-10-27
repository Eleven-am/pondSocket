import {Subscription} from "./pubSub";
import {SimpleBase} from "./simpleBase";
import {PondBaseActions} from "./enums";

declare type ExtractSameValueType<A, B, C extends keyof A> = {
    [K in keyof B]: B[K] extends A[C] ? A[C] extends B[K] ? K : never : never;
}[keyof B];

export declare class PondBase<T> extends SimpleBase<T> {

    constructor();

    /**
     * @des Generate a key for a new document
     */
    private get _nanoid();

    /**
     * @desc Subscribe to the database
     * @param handler - The handler to call when the database is updated
     */
    subscribe(handler: (docs: T[], change: T | null, action: PondBaseActions) => void): Subscription;

    /**
     * @desc Add a document to the database
     * @param doc - The document to add
     */
    addDoc(doc: T): import("./simpleBase").PondDocument<T>;

    /**
     * @desc Left join two ponds on a key on this pond and a foreign key on the other pond
     * @param pond - The pond to join with
     * @param key - The key to join on
     * @param foreignKey - The foreign key to join on
     */
    leftJoin<U, A extends keyof T, B extends ExtractSameValueType<T, U, A>>(pond: PondBase<U>, key: A, foreignKey: B): PondBase<T & {
        [K in A]: U | null;
    }>;
}

export {};
