/// <reference types="node" />
import {ServerResponse} from "http";

export interface CORSOptions {
    origin?: string | string[];
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
}

interface CookieOptions {
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    expires?: Date;
    maxAge?: number;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}

export declare class PondResponse {

    constructor(response: ServerResponse);

    /**
     * @desc Get the underlying response
     */
    get response(): ServerResponse;

    /**
     * @desc Send a json response
     * @param data - The data to send
     */
    json(data: any): void;

    /**
     * @desc Send a html response
     * @param data - The data to send
     */
    html(data: string): void;

    /**
     * #desc Redirect the client to another url
     * @param url - The url to redirect to
     */
    redirect(url: string): void;

    /**
     * @desc Set a header
     * @param key - The key of the header
     * @param value - The value of the header
     */
    setHeader(key: string, value: string): PondResponse;

    /**
     * @desc End the response
     */
    end(): void;

    /**
     * @desc Pipe a stream to the response
     * @param stream - The stream to pipe
     */
    pipe(stream: any): void;

    /**
     * @desc Set the status code of the response
     * @param code - The status code
     * @param message - The status message
     */
    status(code: number, message?: string): PondResponse;

    /**
     * @desc Given an absolute path, send the file to the client with the correct mime type
     * @param filePath - The path to the file
     */
    sendFile(filePath: string): void;

    /**
     * @desc Applies CORS headers to the response based on the provided options
     * @param options - The options to apply
     */
    applyCORS(options: CORSOptions): void;

    /**
     * @desc Set a cookie
     * @param name - The name of the cookie
     * @param value - The value of the cookie
     * @param options - The options to apply to the cookie
     */
    setCookie(name: string, value: string, options?: CookieOptions): void;

    /**
     * @desc Clear a cookie
     * @param name - The name of the cookie
     */
    clearCookie(name: string): void;
}

export {};
