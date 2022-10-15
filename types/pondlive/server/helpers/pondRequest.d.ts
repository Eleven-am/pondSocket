/// <reference types="node" />
import {IncomingMessage} from "http";

export declare class PondRequest {
    constructor(request: IncomingMessage);

    /**
     * @desc Get the body of the request
     */
    get body(): any;

    /**
     * @desc Get the data of the request
     */
    get data(): any;

    /**
     * @desc Set the data of the request
     */
    set data(value: any);

    /**
     * @desc Get the default incoming message
     */
    get request(): IncomingMessage;

    /**
     * @desc Get the url of the request
     */
    get url(): string;

    /**
     * @desc Get the method of the request
     */
    get method(): string;

    get query(): {
        [key: string]: string;
    };

    /**
     * @desc Get a header from the request
     * @param name - The name of the header
     */
    getHeader(name: string): string | null;

    /**
     * @desc Get the cookie of the request
     * @param cookieName - The name of the cookie
     */
    getCookie(cookieName: string): string | null;
}
