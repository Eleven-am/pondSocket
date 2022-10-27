import {default_t, PondPath} from "./types";

export interface Resolver {
    params: default_t<string>;
    query: default_t<string>;
    address: string;
}

export declare class BaseClass {

    /**
     * @desc checks if the pattern is matchable
     * @param pattern - the pattern to check
     */
    protected static isPatternMatchable(pattern: string | RegExp): boolean;

    /**
     * @desc compares string to string | regex
     * @param string - the string to compare to the pattern
     * @param pattern - the pattern to compare to the string
     */
    compareStringToPattern(string: string, pattern: string | RegExp): boolean;

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
     * @desc Compares if two objects are equal
     * @param obj1 - the first object
     * @param obj2 - the second object
     */
    areEqual<T>(obj1: T, obj2: T): boolean;

    /**
     * @desc Creates an object from the params of a path
     * @param path - the path to create the object from
     *
     * @example
     * /api/id?name=abc should return { name: 'abc' }
     * /api/id?name=abc&age=123 should return { name: 'abc', age: '123' }
     */
    protected _parseQueries(path: string): default_t<string>;
}
