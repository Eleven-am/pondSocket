import {default_t, PondPath} from "./types";

export interface Resolver {
    params: default_t<string>;
    query: default_t<string>;
    address: string;
}

export interface EventRequest {
    params: default_t<string>;
    query: default_t<string>;
    nextPath: string;
    address: string;
}

export declare class BaseClass {
    /**
     * @desc compares string to string | regex
     * @param string - the string to compare to the pattern
     * @param pattern - the pattern to compare to the string
     */
    compareStringToPattern(string: string, pattern: string | RegExp): boolean;

    /**
     * @desc creates an uuid v4 string
     */
    uuid(): string;

    /**
     * @desc Generates an 8 character long random string
     */
    nanoId(): string;

    /**
     * @desc Checks if the given object is empty
     * @param obj - the object to check
     */
    isObjectEmpty(obj: object): boolean;

    /**
     * @desc Generates a pond request resolver object
     * @param path - the path to resolve
     * @param address - the address to resolve
     */
    generateEventRequest(path: PondPath, address: string): Resolver | null;

    /**
     * @desc Matches a string to a pattern
     * @param path - the path to match
     * @param address - the address to match
     */
    getLiveRequest(path: string, address: string): EventRequest | null;

    /**
     * @desc Compares if two objects are equal
     * @param obj1 - the first object
     * @param obj2 - the second object
     */
    areEqual<T>(obj1: T, obj2: T): boolean;

    /**
     * @desc decodes a string using it's secret key
     * @param salt - the secret key
     * @param encoded - the encoded string
     */
    decrypt<S>(salt: string, encoded: string): S | null;

    /**
     * @desc encodes an object using into a string using it's secret key
     * @param salt - the secret key
     * @param text - the object to encode
     */
    encrypt(salt: string, text: any): string;
}
